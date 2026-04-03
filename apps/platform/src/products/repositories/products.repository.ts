import { Injectable } from '@nestjs/common';
import { EntityManager, Repository, In, SelectQueryBuilder } from 'typeorm';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { ProductsEntity } from '../entities/products.entity';
import { ProductNamesEntity } from '../entities/productNames.entity';
import { ProductsHistoryEntity } from '../entities/history/productsHistory.entity';
import { ProductStockHistoryEntity } from '../entities/history/productStockHistory.entity';
import { ProductOverviewEntity } from '../entities/productOverview.entity';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
    GetListOfProductByProductUnitIdRequestDto,
} from '@app/common/dtos/platform/products/crudProductRequest.dto';
import {
    CreateProductStockRequestDto,
} from '@app/common/dtos/platform/products/history/crudProductStock.dto';
import { ProductChangedField } from '@app/common/dtos/platform/products/history/snapshot/productSnapshot.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import enums.
import { StockStatus } from '@app/common/enums/stockStatus.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';
import { InvoiceType } from '@app/common/enums/invoiceType.enum';

// Import mappers.
import { ProductMapper } from '@app/common/mappers/platform/product.mapper';

// Import repositories.
import { ProductRankingRepository } from '../../dashboard/repositories/productRanking.repository';

@Injectable()
export class ProductsRepository {
    constructor(
        @InjectRepository(ProductsEntity) private productsRepository: Repository<ProductsEntity>,
        @InjectRepository(ProductNamesEntity) private productNamesRepository: Repository<ProductNamesEntity>,
        @InjectRepository(ProductsHistoryEntity) private productsHistoryRepository: Repository<ProductsHistoryEntity>,
        @InjectRepository(ProductStockHistoryEntity) private productStockHistoryRepository: Repository<ProductStockHistoryEntity>,
        @InjectRepository(ProductOverviewEntity) private productOverviewRepository: Repository<ProductOverviewEntity>,
        private readonly productMapper: ProductMapper,
        private readonly productRankingRepository: ProductRankingRepository,
    ) { }

    // --- DRY methods ---
    // Get the latest version number of a product's history.
    private async getLatestHistoryVersion(id: string, transactionalManager?: EntityManager): Promise<number> {
        const manager = transactionalManager || this.productsHistoryRepository.manager;
        const latestHistory = await manager.findOne(ProductsHistoryEntity, {
            where: { product: { id } },
            order: { version: 'DESC' },
        });
        return latestHistory?.version ?? 0;
    }

    // Clean up old product history versions if exceeding 16 versions.
    private async cleanupOldProductHistoryVersions(id: string, transactionalManager?: EntityManager): Promise<void> {
        const manager = transactionalManager || this.productsHistoryRepository.manager;
        await manager.query(
            `DELETE FROM products_history
            WHERE product_id = $1
            AND id NOT IN (
                SELECT id FROM products_history
                WHERE product_id = $1
                ORDER BY version DESC
                LIMIT 16
            )`,
            [id],
        );
    }

    // Clean up old product stock history if exceeding 64 records.
    private async cleanupOldProductStockHistory(productId: string, transactionalManager: EntityManager): Promise<void> {
        await transactionalManager.query(
            `DELETE FROM product_stock_history
            WHERE product_id = $1
            AND id NOT IN (
                SELECT id FROM product_stock_history
                WHERE product_id = $1
                ORDER BY created_at DESC
                LIMIT 64
             )`,
            [productId],
        );
    }

    // Load and attach productNames for a list of products in a single query.
    private async loadProductNamesForProducts(products: ProductsEntity[]): Promise<void> {
        if (products.length === 0) return;

        const ids = products.map(product => product.id);
        const productNames = await this.productNamesRepository.find({
            where: { product: { id: In(ids) } },
            relations: ['product'],
        });

        const namesMap = new Map<string, ProductNamesEntity[]>();
        productNames.forEach(name => {
            if (!namesMap.has(name.product.id)) namesMap.set(name.product.id, []);
            namesMap.get(name.product.id)!.push(name);
        });

        products.forEach(product => {
            product.productNames = namesMap.get(product.id) || [];
        });
    }

    // --- APIs ---
    // Create a new product.
    async createProduct(dto: CreateProductRequestDto, stockStatus: StockStatus, user: AccessTokenPayload): Promise<ProductsEntity> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            const { productNames, productUnitId, ...productData } = dto;

            // Create product entity with productUnitId.
            const productEntity: ProductsEntity = this.productsRepository.create({
                ...productData,
                productUnit: { id: productUnitId },
            });

            productEntity.stockStatus = stockStatus;

            // Save product first in ProductsEntity.
            const savedProductEntity: ProductsEntity = await transactionalManager.save(ProductsEntity, productEntity);

            // Create and save product names in ProductNamesEntity.
            if (productNames && productNames.length > 0) {
                const productNameEntities = productNames.map(name =>
                    this.productNamesRepository.create({ name, product: savedProductEntity })
                );
                const savedProductNames = await transactionalManager.save(ProductNamesEntity, productNameEntities);
                savedProductEntity.productNames = savedProductNames;
            } else {
                savedProductEntity.productNames = [];
            }

            // Load all relations in one query.
            const productWithRelations = await transactionalManager.findOne(ProductsEntity, {
                where: { id: savedProductEntity.id },
                relations: ['productUnit', 'productNames'],
            });
            const productToReturn = productWithRelations || savedProductEntity;

            // --- History operations ---
            // Create a new product history in ProductsHistoryEntity.
            const newProductSnapshot = this.productMapper.toProductSnapshotDto(productToReturn);
            await transactionalManager.save(ProductsHistoryEntity, {
                product: productToReturn,
                version: 1,
                createdBy: user.id,
                events: [{ fieldName: ProductChangedField.NEW_PRODUCT, previousValue: null, newValue: null }],
                eventSummary: [ProductChangedField.NEW_PRODUCT],
                isSnapshot: true,
                data: newProductSnapshot,
            } as ProductsHistoryEntity);

            // --- Overview operations ---
            // Update the product overview in ProductOverviewEntity with pessimistic lock to prevent race conditions.
            const overviewId = '00000000-0000-0000-0000-000000000001';
            let overview = await transactionalManager.findOne(ProductOverviewEntity, {
                where: { id: overviewId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!overview) overview = this.productOverviewRepository.create({ id: overviewId });
            
            overview.totalProducts += 1;
            overview.outOfStock += 1;
            await transactionalManager.save(ProductOverviewEntity, overview);

            return productToReturn;
        });
    }

    // Edit a product.
    async editProduct(productEntity: ProductsEntity, dto: EditProductRequestDto, user: AccessTokenPayload): Promise<{
        product: ProductsEntity,
        history: ProductsHistoryEntity,
    }> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            const { productNames, productUnitId, ...productData } = dto;

            if (productUnitId) {
                productData['productUnit'] = { id: productUnitId };
            }

            // Snapshot the product state BEFORE any changes.
            const previousProductState = await transactionalManager.findOne(ProductsEntity, {
                where: { id: productEntity.id },
                relations: ['productUnit', 'productNames'],
            });
            const previousSnapshot = previousProductState ? this.productMapper.toProductSnapshotDto(previousProductState) : null;

            // Update the product stock status when the stock threshold is edited.
            if (productData.reorderThreshold !== undefined) {
                if (productEntity.inventoryStock <= 0) productEntity.stockStatus = StockStatus.OUT_OF_STOCK;
                else if (productEntity.reorderThreshold !== null && productEntity.inventoryStock <= productEntity.reorderThreshold) productEntity.stockStatus = StockStatus.REORDER_THRESHOLD_REACHED;
                else productEntity.stockStatus = StockStatus.IN_STOCK;
            }

            // Merge product data without productNames in ProductsEntity.
            this.productsRepository.merge(productEntity, productData);
            const updatedProductEntity: ProductsEntity = await transactionalManager.save(ProductsEntity, productEntity);

            // Update product names if provided in ProductNamesEntity.
            if (productNames !== undefined) {
                // Delete existing product names.
                await transactionalManager.delete(ProductNamesEntity, { product: { id: productEntity.id } });

                // Create and save new product names if array is not empty.
                if (productNames.length > 0) {
                    const productNameEntities = productNames.map(name => this.productNamesRepository.create({ name, product: updatedProductEntity }));
                    const savedProductNames = await transactionalManager.save(ProductNamesEntity, productNameEntities);
                    updatedProductEntity.productNames = savedProductNames;
                } else {
                    updatedProductEntity.productNames = [];
                }
            }

            // Load all relations in one query.
            const productWithRelations = await transactionalManager.findOne(ProductsEntity, {
                where: { id: updatedProductEntity.id },
                relations: ['productUnit', 'productNames'],
            });

            const productToReturn = productWithRelations || updatedProductEntity;

            // --- History operations ---
            // Get the latest version from history using transactionalManager.
            const currentVersion = await this.getLatestHistoryVersion(productEntity.id, transactionalManager);
            const nextVersion = currentVersion + 1;

            // Compute change events by comparing previous vs current snapshot.
            const currentSnapshot = this.productMapper.toProductSnapshotDto(productToReturn);
            const events = this.productMapper.toProductChangeEventDtos(previousSnapshot, currentSnapshot);
            const eventSummary = events.map(e => e.fieldName);

            // Every 5th version is a full snapshot; others only store events.
            const isSnapshot = nextVersion % 5 === 0;

            // Create a new product history entry.
            const newHistory = await transactionalManager.save(ProductsHistoryEntity, {
                product: productToReturn,
                version: nextVersion,
                createdBy: user.id,
                events,
                eventSummary,
                isSnapshot,
                data: isSnapshot ? currentSnapshot : null,
            } as ProductsHistoryEntity);

            // Clean up old product history versions if exceeding 10.
            await this.cleanupOldProductHistoryVersions(productEntity.id, transactionalManager);

            return { product: productToReturn, history: newHistory };
        });
    }

    // Update the inventory stock of a product with stock history.
    async updateInventoryStock(
        productEntity: ProductsEntity,
        quantity: number,
        action: StockActionType,
        referenceType: InvoiceType,
        referenceId: string,
        manager: EntityManager,
    ): Promise<ProductsEntity> {

        // Get the iventory stock before any changes.
        const beforeInventoryStock = productEntity.inventoryStock;
        const beforeStockStatus = productEntity.stockStatus;

        // Update product stock.
        if (action === StockActionType.ADD) productEntity.inventoryStock += quantity;
        else if (action === StockActionType.SUBTRACT) productEntity.inventoryStock -= quantity;

        // Get the iventory stock after any changes.
        const afterInventoryStock = productEntity.inventoryStock;

        // Update stock status.
        if (productEntity.inventoryStock <= 0) productEntity.stockStatus = StockStatus.OUT_OF_STOCK;
        else if (productEntity.reorderThreshold !== null && productEntity.inventoryStock <= productEntity.reorderThreshold) productEntity.stockStatus = StockStatus.REORDER_THRESHOLD_REACHED;
        else productEntity.stockStatus = StockStatus.IN_STOCK;

        await manager.save(ProductsEntity, productEntity);

        // Load all relations in one query.
        const productWithRelations = await manager.findOne(ProductsEntity, {
            where: { id: productEntity.id },
            relations: ['productUnit', 'productNames'],
        });
        const productToReturn = productWithRelations || productEntity;

        // --- Stock history operations ---
        // Create product stock history.
        const history = this.productStockHistoryRepository.create({
            product: { id: productEntity.id },
            quantityType: action,
            quantity: quantity,
            referenceType: referenceType,
            referenceId: referenceId,
            beforeInventoryStock,
            afterInventoryStock,
        });
        await manager.save(ProductStockHistoryEntity, history);
        await this.cleanupOldProductStockHistory(productEntity.id, manager);

        // --- Overview operations ---
        // Update the productOverview entity with pessimistic lock.
        const overviewId = '00000000-0000-0000-0000-000000000001';
        let overview = await manager.findOne(ProductOverviewEntity, {
            where: { id: overviewId },
            lock: { mode: 'pessimistic_write' },
        });
        if (!overview) overview = this.productOverviewRepository.create({ id: overviewId });


        // Update stock status counts.
        if (beforeStockStatus !== productEntity.stockStatus) {
            if (beforeStockStatus === StockStatus.IN_STOCK) overview.inStock -= 1;
            else if (beforeStockStatus === StockStatus.REORDER_THRESHOLD_REACHED) overview.lowStock -= 1;
            else if (beforeStockStatus === StockStatus.OUT_OF_STOCK) overview.outOfStock -= 1;

            if (productEntity.stockStatus === StockStatus.IN_STOCK) overview.inStock += 1;
            else if (productEntity.stockStatus === StockStatus.REORDER_THRESHOLD_REACHED) overview.lowStock += 1;
            else if (productEntity.stockStatus === StockStatus.OUT_OF_STOCK) overview.outOfStock += 1;
        }

        // Update total inventory value by adding the delta change.
        const inventoryValueDelta = Number(productEntity.importPrice) * (afterInventoryStock - beforeInventoryStock);
        overview.inventoryValue = Number(overview.inventoryValue) + inventoryValueDelta;

        await manager.save(ProductOverviewEntity, overview);

        // --- Update the productRankingDaily entity ---
        const totalPrice = Number(productEntity.sellingPrice) * quantity;
        await this.productRankingRepository.storeProductRankingDaily(
            manager,
            productEntity.id,
            referenceType,
            quantity,
            totalPrice
        );

        return productToReturn;
    }

    // Get a product by sku.
    async getProductBySku(sku: string): Promise<ProductsEntity | null> {
        const productEntity: ProductsEntity | null = await this.productsRepository.findOne({
            where: { sku },
            relations: ['productUnit', 'productNames'],
        });
        if (!productEntity) return null;
        return productEntity;
    }

    // Get a product by id.
    async getProductById(id: string): Promise<ProductsEntity | null> {
        const productEntity: ProductsEntity | null = await this.productsRepository.findOne({
            where: { id },
            relations: ['productUnit', 'productNames'],
        });
        if (!productEntity) return null;
        return productEntity;
    }

    // Get multiple products by their ids in a single query.
    async getProductsByIds(ids: string[]): Promise<ProductsEntity[]> {
        if (ids.length === 0) return [];

        const products = await this.productsRepository.find({
            where: { id: In(ids) },
            relations: ['productUnit'],
        });

        await this.loadProductNamesForProducts(products);
        return products;
    }

    // Get multiple products by their SKUs in a single query.
    async getProductsBySkus(skus: string[]): Promise<ProductsEntity[]> {
        if (skus.length === 0) return [];

        const products = await this.productsRepository.find({
            where: { sku: In(skus) },
            relations: ['productUnit'],
        });

        await this.loadProductNamesForProducts(products);
        return products;
    }

    // Get a list of products with filters and sorting.
    async getListOfProducts(dto: GetListOfProductRequestDto): Promise<{ products: ProductsEntity[], total: number }> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', isActive, stockStatus } = dto;

        // Apply filters to the query builder.
        const applyFilters = (queryBuilder: SelectQueryBuilder<ProductsEntity>) => {

            // Search by filters.
            if (search && searchBy) {
                if (searchBy === 'productName') {
                    queryBuilder.andWhere(
                        `EXISTS (SELECT 1 FROM product_names pn WHERE pn.product_id = product.id AND pn.name ILIKE :nameSearch)`,
                        { nameSearch: `%${search}%` },
                    );
                }
                else if (searchBy === 'sku') queryBuilder.andWhere('product.sku ILIKE :search', { search: `${search}%` });
                else if (searchBy === 'importPrice') {
                    const searchNum = parseFloat(search);
                    if (!isNaN(searchNum)) {
                        queryBuilder.andWhere(
                            'product.importPrice >= :minPrice AND product.importPrice <= :maxPrice',
                            { minPrice: searchNum, maxPrice: searchNum + 1 },
                        );
                    }
                }
                else if (searchBy === 'sellingPrice') {
                    const searchNum = parseFloat(search);
                    if (!isNaN(searchNum)) {
                        queryBuilder.andWhere(
                            'product.sellingPrice >= :minPrice AND product.sellingPrice <= :maxPrice',
                            { minPrice: searchNum, maxPrice: searchNum + 1 },
                        );
                    }
                }
            }

            // Apply active status filter.
            if (isActive !== undefined && isActive !== 'all') queryBuilder.andWhere('product.active = :active', { active: isActive === 'true' });

            // Apply stock status filter.
            if (stockStatus !== undefined && stockStatus !== 'all') {
                const status = parseInt(stockStatus);
                if (!isNaN(status)) {
                    queryBuilder.andWhere('product.stockStatus = :stockStatus', { stockStatus: status });
                }
            }
        };
        

        // Create the query builder for counting total products.
        const countQueryBuilder = this.productsRepository.createQueryBuilder('product');
        applyFilters(countQueryBuilder);

        const queryBuilder = this.productsRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.productUnit', 'productUnit');
        applyFilters(queryBuilder);

        // Sort the data based on the sortBy field.
        if (sortBy === 'productName') {
            queryBuilder.addSelect(
                `(SELECT MIN(pn.name) FROM product_names pn WHERE pn.product_id = product.id)`,
                'product_name_sort',
            );
            queryBuilder.orderBy('product_name_sort', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        }
        else {
            const sortField = sortBy === 'productUnitName' ? 'productUnit.unitName'
                : sortBy === 'importPrice' ? 'product.importPrice'
                    : sortBy === 'sellingPrice' ? 'product.sellingPrice'
                        : sortBy === 'stockStatus' ? 'product.stockStatus'
                            : sortBy === 'inventoryStock' ? 'product.inventoryStock'
                                : sortBy === 'createdAt' ? 'product.createdAt'
                                    : sortBy === 'updatedAt' ? 'product.updatedAt'
                                        : sortBy === 'sku' ? 'product.sku'
                                            : 'product.createdAt';
            queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');
        }
        queryBuilder.addOrderBy('product.id', 'ASC');
        queryBuilder.skip((page - 1) * limit).take(limit);

        // DB calls: Get total count of products and fetch products.
        const [total, products] = await Promise.all([
            countQueryBuilder.getCount(),
            queryBuilder.getMany(),
        ]);

        await this.loadProductNamesForProducts(products);

        return { products, total };
    }

    // Get a list of product with specific product unit id.
    async getListOfProductByProductUnitId(dto: GetListOfProductByProductUnitIdRequestDto): Promise<{ products: ProductsEntity[], total: number }> {
        const { page = 1, limit = 10, productUnitId } = dto;

        const [products, total] = await this.productsRepository.findAndCount({
            where: { productUnit: { id: productUnitId } },
            relations: ['productUnit'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        await this.loadProductNamesForProducts(products);

        return { products, total };
    }

    // Activate a product.
    async activateProduct(productEntity: ProductsEntity, user: AccessTokenPayload): Promise<{
        product: ProductsEntity,
        history: ProductsHistoryEntity,
    }> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            productEntity.active = true;
            await transactionalManager.save(ProductsEntity, productEntity);

            // Load all relations in one query.
            const productWithRelations = await transactionalManager.findOne(ProductsEntity, {
                where: { id: productEntity.id },
                relations: ['productUnit', 'productNames'],
            });

            const productToReturn = productWithRelations || productEntity;

            // --- History operations ---
            // Get the latest version from history using transactionalManager.
            const currentVersion = await this.getLatestHistoryVersion(productEntity.id, transactionalManager);
            const nextVersion = currentVersion + 1;

            const events = [{ fieldName: ProductChangedField.ACTIVE, previousValue: 'false', newValue: 'true' }];
            const eventSummary = [ProductChangedField.ACTIVE];
            const isSnapshot = nextVersion % 5 === 0;

            // Create a new product history entry.
            const newHistory = await transactionalManager.save(ProductsHistoryEntity, {
                product: productToReturn,
                version: nextVersion,
                createdBy: user.id,
                events,
                eventSummary,
                isSnapshot,
                data: isSnapshot ? this.productMapper.toProductSnapshotDto(productToReturn) : null,
            } as ProductsHistoryEntity);

            // Clean up old product history versions if exceeding 16.
            await this.cleanupOldProductHistoryVersions(productEntity.id, transactionalManager);

            return { product: productToReturn, history: newHistory };
        });
    }

    // Deactivate a product.
    async deactivateProduct(productEntity: ProductsEntity, user: AccessTokenPayload): Promise<{
        product: ProductsEntity,
        history: ProductsHistoryEntity,
    }> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            productEntity.active = false;
            await transactionalManager.save(ProductsEntity, productEntity);

            // Load all relations in one query.
            const productWithRelations = await transactionalManager.findOne(ProductsEntity, {
                where: { id: productEntity.id },
                relations: ['productUnit', 'productNames'],
            });

            const productToReturn = productWithRelations || productEntity;

            // Get the latest version from history using transactionalManager.
            const currentVersion = await this.getLatestHistoryVersion(productEntity.id, transactionalManager);
            const nextVersion = currentVersion + 1;

            const events = [{ fieldName: ProductChangedField.ACTIVE, previousValue: 'true', newValue: 'false' }];
            const eventSummary = [ProductChangedField.ACTIVE];
            const isSnapshot = nextVersion % 5 === 0;

            // --- History operations ---
            // Create a new product history entry.
            const newHistory = await transactionalManager.save(ProductsHistoryEntity, {
                product: productToReturn,
                version: nextVersion,
                createdBy: user.id,
                events,
                eventSummary,
                isSnapshot,
                data: isSnapshot ? this.productMapper.toProductSnapshotDto(productToReturn) : null,
            } as ProductsHistoryEntity);

            // Clean up old product history versions if exceeding 16.
            await this.cleanupOldProductHistoryVersions(productEntity.id, transactionalManager);

            return { product: productToReturn, history: newHistory };
        });
    }

    // --- History APIs ---
    // Get a list of history versions for a product.
    async getProductHistoryList(id: string): Promise<Omit<ProductsHistoryEntity, 'data'>[]> {
        const queryBuilder = this.productsHistoryRepository.createQueryBuilder('history');

        // Filter by product id.
        queryBuilder.where('history.product.id = :id', { id });

        // Sort by version descending.
        queryBuilder.orderBy('history.version', 'DESC');

        // Execute query and select fields except 'data'.
        const histories = await queryBuilder
            .select([
                'history.id',
                'history.version',
                'history.createdBy',
                'history.createdAt',
                'history.eventSummary',
            ])
            .getMany();

        // Return history list.
        return histories as Omit<ProductsHistoryEntity, 'data'>[];
    }

    // Get a specific history version's data for a product.
    async getProductHistoryByVersion(id: string, version: number): Promise<ProductsHistoryEntity | null> {
        const history = await this.productsHistoryRepository.findOne({
            where: {
                product: { id },
                version: version,
            },
        });
        return history || null;
    }

    // --- Product Stock History APIs ---
    // Create product stock history.
    async createProductStockHistory(dto: CreateProductStockRequestDto): Promise<ProductStockHistoryEntity> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            const history = this.productStockHistoryRepository.create({
                product: { id: dto.productId },
                quantityType: dto.quantityType,
                quantity: dto.quantity,
                referenceType: dto.referenceType,
                referenceId: dto.referenceId,
            });
            const savedHistory = await transactionalManager.save(ProductStockHistoryEntity, history);

            // Clean up old product stock history if exceeding 64 records.
            await this.cleanupOldProductStockHistory(dto.productId, transactionalManager);

            return savedHistory;
        });
    }

    // Get a list of product stock history.
    async getProductStockHistoryList(productId: string): Promise<{ data: ProductStockHistoryEntity[], total: number }> {
        const [data, total] = await this.productStockHistoryRepository.findAndCount({
            where: { product: { id: productId } },
            take: 10,
            skip: 0,
            order: { createdAt: 'DESC' },
            relations: ['product'],
        });
        return { data, total };
    }

    // Get a specific product stock history.
    async getProductStockHistoryById(id: string): Promise<ProductStockHistoryEntity | null> {
        const history = await this.productStockHistoryRepository.findOne({
            where: { id },
            relations: ['product'],
        });
        return history || null;
    }

    // --- Product Overview APIs ---
    // Get the product overview.
    async getProductOverview(): Promise<ProductOverviewEntity | null> {
        const overviewId = '00000000-0000-0000-0000-000000000001';
        const overview = await this.productOverviewRepository.findOne({
            where: { id: overviewId },
        });
        return overview || null;
    }

}
