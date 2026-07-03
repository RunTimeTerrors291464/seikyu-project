import { Injectable } from '@nestjs/common';
import { EntityManager, EntityNotFoundError, Repository, In, SelectQueryBuilder } from 'typeorm';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { ProductsEntity } from '../entities/products.entity';
import { ProductNamesEntity } from '../entities/productNames.entity';
import { ProductsHistoryEntity } from '../entities/productsHistory.entity';
import { ProductStockHistoryEntity } from '../entities/productStockHistory.entity';
import { ProductOverviewEntity } from '../entities/productOverview.entity';
import { ProductUnitsEntity } from '@src/productUnits/entities/productUnits.entity';

// Import repositories.
import { ProductRankingRepository } from '@src/dashboard/repositories/productRanking.repository';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
    GetListOfProductByProductUnitIdRequestDto,
} from '@libs/common/dtos/products/crudProductRequest.dto';
import { GetProductHistoryListRequestDto, GetProductStockHistoryListRequestDto } from '@libs/common/dtos/products/crudProductHistoryRequest.dto';
import { ProductSnapshotDto, ProductChangeEventDto, ProductChangedField } from '@libs/common/dtos/products/productSnapshot.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import mappers.
import { ProductMapper } from '@libs/common/mappers/product.mapper';

// Import enums.
import { StockStatus } from '@libs/common/enums/stockStatus.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';

// Import search helpers.
import { buildWildcardIlikePattern, WILDCARD_ILIKE_ESCAPE_SQL } from '@libs/common/utils/wildcardIlikeSearch.util';

// One invoice line to apply against inventory stock.
export interface InventoryStockBulkItem {
    productId: string;
    quantity: number;
    action: StockActionType;
    rankingTotalPrice?: number;
}

@Injectable()
export class ProductsRepository {
    constructor(
        @InjectRepository(ProductsEntity) private readonly productsRepository: Repository<ProductsEntity>,
        @InjectRepository(ProductNamesEntity) private readonly productNamesRepository: Repository<ProductNamesEntity>,
        @InjectRepository(ProductsHistoryEntity) private readonly productsHistoryRepository: Repository<ProductsHistoryEntity>,
        @InjectRepository(ProductStockHistoryEntity) private readonly productStockHistoryRepository: Repository<ProductStockHistoryEntity>,
        @InjectRepository(ProductOverviewEntity) private readonly productOverviewRepository: Repository<ProductOverviewEntity>,
        private readonly productMapper: ProductMapper,
        
        private readonly productRankingRepository: ProductRankingRepository,
    ) { }

    // --- Private variables ---
    private static readonly PRODUCT_OVERVIEW_ID: string = '00000000-0000-0000-0000-000000000001';

    // --- DRY methods ---
    // Update the product overview.
    private async updateProductOverview(
        updates: Array<{ fieldName: string, isIncrease: boolean, quantity: number }>,
        manager: EntityManager,
    ): Promise<ProductOverviewEntity> {

        // Get the product overview.
        let productOverview: ProductOverviewEntity | null = await manager.findOne(ProductOverviewEntity, {
            where: { id: ProductsRepository.PRODUCT_OVERVIEW_ID },
        });
        if (!productOverview) productOverview = manager.create(ProductOverviewEntity, { id: ProductsRepository.PRODUCT_OVERVIEW_ID });

        // Check if the fields are valid and update the product overview.
        for (const update of updates) {
            if (update.fieldName && productOverview.hasOwnProperty(update.fieldName)) {
                const currentValue = Number((productOverview as unknown as Record<string, unknown>)[update.fieldName] ?? 0);
                const newValue = update.isIncrease ? currentValue + update.quantity : currentValue - update.quantity;
                (productOverview as unknown as Record<string, number>)[update.fieldName] = newValue;
            }
        }

        // Update the product overview.
        return await manager.save(productOverview);
    }

    // Get the latest version number of a product's history.
    private async getLatestHistoryVersion(productId: string, manager: EntityManager): Promise<number> {
        const latestHistory: ProductsHistoryEntity | null = await manager.findOne(ProductsHistoryEntity, {
            where: { product: { id: productId } },
            order: { version: 'DESC' },
        });
        return latestHistory?.version ?? 0;
    }

    // Clean up old product history versions if exceeding 16 versions.
    private async cleanupOldProductHistoryVersions(productId: string, manager: EntityManager): Promise<void> {
        const histories: ProductsHistoryEntity[] = await manager.find(ProductsHistoryEntity, {
            where: { product: { id: productId } },
            order: { version: 'DESC' },
        });

        if (histories.length > 16) {
            const toDelete: ProductsHistoryEntity[] = histories.slice(0, histories.length - 16);
            await manager.remove(ProductsHistoryEntity, toDelete);
        }
    }

    // Load product names for multiple products in a single query.
    private async loadProductNamesForProducts(products: ProductsEntity[]): Promise<void> {
        if (products.length === 0) return;

        const productIds: string[] = products.map(p => p.id);
        const allProductNames: ProductNamesEntity[] = await this.productNamesRepository.find({
            where: { product: { id: In(productIds) } },
        });

        const namesByProductId: Map<string, ProductNamesEntity[]> = new Map();
        allProductNames.forEach((name) => {
            const productId = name.productId;
            if (!namesByProductId.has(productId)) {
                namesByProductId.set(productId, []);
            }
            namesByProductId.get(productId)!.push(name);
        });

        products.forEach(product => {
            product.productNames = namesByProductId.get(product.id) || [];
        });
    }

    // --- Public methods ---
    // Create a new product.
    async createNewProduct(dto: CreateProductRequestDto, user: AccessTokenPayload, manager: EntityManager): Promise<ProductsEntity> {
        const { productNames, ...productFields } = dto;

        // Create a new product - ProductsEntity.
        const savedProduct: ProductsEntity = await manager.save(ProductsEntity, { ...productFields, stockStatus: StockStatus.OUT_OF_STOCK });

        // Create product names - ProductNamesEntity.
        if (productNames.length > 0) {
            await manager.save(ProductNamesEntity, productNames.map((name, index) => ({
                productId: savedProduct.id,
                name,
                isMain: index === 0,
            })));
        }

        // Load product with product names and product unit.
        const product: ProductsEntity = await manager.findOneOrFail(ProductsEntity, {
            where: { id: savedProduct.id },
            relations: ['productNames', 'productUnit'],
        });

        // --- History methods ---
        // Create a product history - ProductsHistoryEntity.
        const productSnapshot: ProductSnapshotDto = this.productMapper.toProductSnapshotDto(product);
        await manager.save(ProductsHistoryEntity, {
            productId: savedProduct.id,
            version: 1,
            createdBy: user.id,
            events: [{ fieldName: ProductChangedField.NEW_PRODUCT, previousValue: null, newValue: null }],
            eventSummary: [ProductChangedField.NEW_PRODUCT],
            isSnapshot: true,
            data: productSnapshot,
        });

        // --- Product Overview methods ---
        await this.updateProductOverview(
            [
                { fieldName: 'totalProducts', isIncrease: true, quantity: 1 },
                { fieldName: 'outOfStock', isIncrease: true, quantity: 1 },
            ], manager);

        return product;
    }

    // Edit a product.
    async editProduct(productEntity: ProductsEntity, dto: EditProductRequestDto, user: AccessTokenPayload, manager: EntityManager): Promise<{
        product: ProductsEntity,
        history: ProductsHistoryEntity
    }> {
        const { productNames, ...productData } = dto;

        // Snapshot the product state BEFORE any changes.
        const previousProductState: ProductsEntity | null = await manager.findOne(ProductsEntity, {
            where: { id: productEntity.id },
            relations: ['productUnit', 'productNames'],
        });
        const previousSnapshot: ProductSnapshotDto | null = previousProductState ? this.productMapper.toProductSnapshotDto(previousProductState) : null;

        // Update the product stock status when the stock threshold is edited.
        if (productData.reorderThreshold !== undefined) {
            if (productEntity.inventoryStock <= 0) productEntity.stockStatus = StockStatus.OUT_OF_STOCK;
            else if (productData.reorderThreshold !== null && productEntity.inventoryStock <= productData.reorderThreshold) productEntity.stockStatus = StockStatus.REORDER_THRESHOLD_REACHED;
            else productEntity.stockStatus = StockStatus.IN_STOCK;
        }

        // Merge product data into entity - ProductsEntity.
        this.productsRepository.merge(productEntity, productData);
        // Sync the relation reference when productUnitId changes so TypeORM writes the correct FK column.
        if (productData.productUnitId) {
            productEntity.productUnit = { id: productData.productUnitId } as ProductUnitsEntity;
        }
        const updatedProductEntity: ProductsEntity = await manager.save(ProductsEntity, productEntity);

        // Update product names if provided - ProductNamesEntity.
        if (productNames !== undefined) {
            await manager.delete(ProductNamesEntity, { product: { id: productEntity.id } });

            if (productNames.length > 0) {
                const productNameEntities = productNames.map((name, index) =>
                    this.productNamesRepository.create({ name, isMain: index === 0, product: updatedProductEntity }),
                );
                const savedProductNames = await manager.save(ProductNamesEntity, productNameEntities);
                updatedProductEntity.productNames = savedProductNames;
            } else {
                updatedProductEntity.productNames = [];
            }
        }

        // Load all relations in one query.
        const productWithRelations: ProductsEntity = await manager.findOneOrFail(ProductsEntity, {
            where: { id: updatedProductEntity.id },
            relations: ['productUnit', 'productNames'],
        });

        // --- History methods ---
        // Get the latest version and compute next version.
        const currentVersion: number = await this.getLatestHistoryVersion(productEntity.id, manager);
        const nextVersion: number = currentVersion + 1;

        // Compute change events by comparing previous vs current snapshot.
        const currentSnapshot: ProductSnapshotDto = this.productMapper.toProductSnapshotDto(productWithRelations);
        const events: ProductChangeEventDto[] = this.productMapper.toProductChangeEventDtos(previousSnapshot, currentSnapshot);
        const eventSummary: ProductChangedField[] = events.map(e => e.fieldName as ProductChangedField);

        // Every 5th version is a full snapshot; others only store events.
        const isSnapshot: boolean = nextVersion % 5 === 0;

        // Create a new product history entry - ProductsHistoryEntity.
        const savedHistory: ProductsHistoryEntity = await manager.save(ProductsHistoryEntity, {
            product: updatedProductEntity,
            version: nextVersion,
            createdBy: user.id,
            events,
            eventSummary,
            isSnapshot,
            data: isSnapshot ? currentSnapshot : null,
        });

        // Get the product history with the created by user - ProductsHistoryEntity.
        const productHistory: ProductsHistoryEntity = await manager.findOneOrFail(ProductsHistoryEntity, {
            where: { id: savedHistory.id },
            relations: ['createdByUser'],
        });

        // Clean up old product history versions.
        await this.cleanupOldProductHistoryVersions(productEntity.id, manager);

        return {
            product: productWithRelations,
            history: productHistory,
        };
    }

    // Update the inventory stock of a product.
    async updateInventoryStock(productEntity: ProductsEntity, quantity: number, action: StockActionType, invoiceType: InvoiceType, invoiceId: string, manager: EntityManager, rankingTotalPrice?: number): Promise<ProductsEntity> {

        const [updatedProduct] = await this.updateInventoryStockBulk(
            [{ productId: productEntity.id, quantity, action, rankingTotalPrice }],
            invoiceType,
            invoiceId,
            manager,
        );

        // Load product with all relations for return value.
        const productWithRelations: ProductsEntity | null = await manager.findOne(ProductsEntity, {
            where: { id: updatedProduct.id },
            relations: ['productUnit', 'productNames'],
        });

        return productWithRelations || updatedProduct;
    }

    // Update the inventory stock of many invoice lines in one batched pass.
    async updateInventoryStockBulk(
        items: InventoryStockBulkItem[],
        invoiceType: InvoiceType,
        invoiceId: string,
        manager: EntityManager,
    ): Promise<ProductsEntity[]> {
        if (items.length === 0) return [];

        // Lock all involved product rows in one query, ordered by id to avoid deadlocks between concurrent invoices.
        const uniqueProductIds: string[] = [...new Set(items.map((item) => item.productId))].sort();
        const lockedProducts: ProductsEntity[] = await manager
            .createQueryBuilder(ProductsEntity, 'products')
            .where('products.id IN (:...ids)', { ids: uniqueProductIds })
            .orderBy('products.id', 'ASC')
            .setLock('pessimistic_write')
            .getMany();

        const productsById: Map<string, ProductsEntity> = new Map(lockedProducts.map((product) => [product.id, product]));
        const missingProductId: string | undefined = uniqueProductIds.find((id) => !productsById.has(id));
        if (missingProductId) throw new EntityNotFoundError(ProductsEntity, { where: { id: missingProductId } });

        // Snapshot the initial stock and status per product before any changes.
        const initialStockById: Map<string, number> = new Map(lockedProducts.map((product) => [product.id, product.inventoryStock]));
        const initialStatusById: Map<string, StockStatus> = new Map(lockedProducts.map((product) => [product.id, product.stockStatus]));

        // Apply lines in order, chaining before/after stock per history record - ProductStockHistoryEntity.
        const historyRows: Partial<ProductStockHistoryEntity>[] = [];
        for (const item of items) {
            const product: ProductsEntity = productsById.get(item.productId)!;
            const beforeInventoryStock: number = product.inventoryStock;

            if (item.action === StockActionType.ADD) product.inventoryStock += item.quantity;
            else if (item.action === StockActionType.SUBTRACT) product.inventoryStock -= item.quantity;

            historyRows.push({
                productId: product.id,
                quantityType: item.action,
                quantity: item.quantity,
                invoiceType,
                invoiceId,
                beforeInventoryStock,
                afterInventoryStock: product.inventoryStock,
            });
        }

        // Update stock status based on final inventory level.
        for (const product of lockedProducts) {
            if (product.inventoryStock <= 0) product.stockStatus = StockStatus.OUT_OF_STOCK;
            else if (product.reorderThreshold !== null && product.inventoryStock <= product.reorderThreshold) product.stockStatus = StockStatus.REORDER_THRESHOLD_REACHED;
            else product.stockStatus = StockStatus.IN_STOCK;
        }

        // Save all updated product entities in one flush - ProductsEntity.
        await manager.save(ProductsEntity, lockedProducts, { reload: false });

        // --- Stock history methods ---
        // Insert all product stock history records in one statement - ProductStockHistoryEntity.
        await manager.insert(ProductStockHistoryEntity, historyRows);

        // Clean up old product stock history records if exceeding 64, one query for all affected products.
        await manager.query(`
            DELETE FROM product_stock_history
            WHERE id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY created_at DESC, id DESC) AS rn
                    FROM product_stock_history
                    WHERE product_id = ANY($1::uuid[])
                ) ranked
                WHERE ranked.rn > 64
            )
        `, [uniqueProductIds]);

        // --- Overview methods ---
        const overviewUpdates: Array<{ fieldName: string, isIncrease: boolean, quantity: number }> = [];
        let inventoryValueDelta: number = 0;

        for (const product of lockedProducts) {
            // Queue stock status count changes if status changed (per-line transitions telescope to initial -> final).
            const beforeStockStatus: StockStatus = initialStatusById.get(product.id)!;
            if (beforeStockStatus !== product.stockStatus) {
                if (beforeStockStatus === StockStatus.IN_STOCK) overviewUpdates.push({ fieldName: 'inStock', isIncrease: false, quantity: 1 });
                else if (beforeStockStatus === StockStatus.REORDER_THRESHOLD_REACHED) overviewUpdates.push({ fieldName: 'lowStock', isIncrease: false, quantity: 1 });
                else if (beforeStockStatus === StockStatus.OUT_OF_STOCK) overviewUpdates.push({ fieldName: 'outOfStock', isIncrease: false, quantity: 1 });

                if (product.stockStatus === StockStatus.IN_STOCK) overviewUpdates.push({ fieldName: 'inStock', isIncrease: true, quantity: 1 });
                else if (product.stockStatus === StockStatus.REORDER_THRESHOLD_REACHED) overviewUpdates.push({ fieldName: 'lowStock', isIncrease: true, quantity: 1 });
                else if (product.stockStatus === StockStatus.OUT_OF_STOCK) overviewUpdates.push({ fieldName: 'outOfStock', isIncrease: true, quantity: 1 });
            }

            inventoryValueDelta += Number(product.importPrice) * (product.inventoryStock - initialStockById.get(product.id)!);
        }

        // Queue inventory value delta change.
        overviewUpdates.push({ fieldName: 'inventoryValue', isIncrease: inventoryValueDelta >= 0, quantity: Math.abs(inventoryValueDelta) });

        await this.updateProductOverview(overviewUpdates, manager);

        // --- Update the productRankingDaily entity ---
        const rankingByProductId: Map<string, { quantity: number, totalPrice: number }> = new Map();
        for (const item of items) {
            const product: ProductsEntity = productsById.get(item.productId)!;
            const totalPrice: number = item.rankingTotalPrice ?? Number(product.sellingPrice) * item.quantity;
            const aggregate = rankingByProductId.get(item.productId) ?? { quantity: 0, totalPrice: 0 };
            aggregate.quantity += item.quantity;
            aggregate.totalPrice += totalPrice;
            rankingByProductId.set(item.productId, aggregate);
        }
        await this.productRankingRepository.storeProductRankingDailyBulk(
            manager,
            invoiceType,
            [...rankingByProductId].map(([productId, aggregate]) => ({ productId, ...aggregate })),
        );

        return lockedProducts;
    }

    // Deactivate or activate a product.
    async deactivateOrActivateProduct(productEntity: ProductsEntity, isActive: boolean, user: AccessTokenPayload, manager: EntityManager): Promise<{
        product: ProductsEntity,
        history: ProductsHistoryEntity,
    }> {

        // Set the previous active status and set the new active status - ProductsEntity.
        const previousActive: boolean = productEntity.isActive;
        productEntity.isActive = isActive;
        const updatedProduct: ProductsEntity = await manager.save(ProductsEntity, productEntity);

        // Load all relations in one query.
        const productWithRelations: ProductsEntity = await manager.findOneOrFail(ProductsEntity, {
            where: { id: updatedProduct.id },
            relations: ['productUnit', 'productNames'],
        });

        // --- History methods ---
        // Get the next version number.
        const nextVersion: number = (await this.getLatestHistoryVersion(productEntity.id, manager)) + 1;

        // Compute the changes.
        const events: ProductChangeEventDto[] = [{
            fieldName: ProductChangedField.IS_ACTIVE,
            previousValue: previousActive ? 'true' : 'false',
            newValue: isActive ? 'true' : 'false',
        }];
        const isSnapshot: boolean = nextVersion % 5 === 0;
        const currentSnapshot: ProductSnapshotDto = this.productMapper.toProductSnapshotDto(productWithRelations);

        // Create a product history - ProductsHistoryEntity.
        const savedHistory: ProductsHistoryEntity = await manager.save(ProductsHistoryEntity, {
            product: productWithRelations,
            version: nextVersion,
            createdBy: user.id,
            events,
            eventSummary: [ProductChangedField.IS_ACTIVE],
            isSnapshot,
            data: isSnapshot ? currentSnapshot : null,
        });

        // Get the product history with the created by user - ProductsHistoryEntity.
        const productHistory: ProductsHistoryEntity = await manager.findOneOrFail(ProductsHistoryEntity, {
            where: { id: savedHistory.id },
            relations: ['createdByUser'],
        });

        // Clean up old product history versions if exceeding 16 versions.
        await this.cleanupOldProductHistoryVersions(productEntity.id, manager);

        return { product: productWithRelations, history: productHistory };
    }

    // Get a product by SKU.
    async getProductBySku(sku: string): Promise<ProductsEntity | null> {
        const productEntity: ProductsEntity | null = await this.productsRepository.findOne({
            where: { sku },
            relations: ['productUnit', 'productNames'],
        });
        if (!productEntity) return null;
        return productEntity;
    }

    // Get a product by ID.
    async getProductById(id: string): Promise<ProductsEntity | null> {
        const productEntity: ProductsEntity | null = await this.productsRepository.findOne({
            where: { id },
            relations: ['productUnit', 'productNames'],
        });
        if (!productEntity) return null;
        return productEntity;
    }

    // Get multiple products by their IDs in a single query.
    async getProductsByIds(ids: string[]): Promise<ProductsEntity[]> {
        if (ids.length === 0) return [];

        const products: ProductsEntity[] = await this.productsRepository.find({
            where: { id: In(ids) },
            relations: ['productUnit'],
        });

        await this.loadProductNamesForProducts(products);
        return products;
    }

    // Get multiple products by their SKUs in a single query.
    async getProductsBySkus(skus: string[]): Promise<ProductsEntity[]> {
        if (skus.length === 0) return [];

        const products: ProductsEntity[] = await this.productsRepository.find({
            where: { sku: In(skus) },
            relations: ['productUnit'],
        });

        await this.loadProductNamesForProducts(products);
        return products;
    }

    // Get bulk product's inventory stock by product id.
    async getBulkProductInventoryStock(productIds: string[]): Promise<{ productId: string, inventoryStock: number }[]> {
        if (productIds.length === 0) return [];

        const rows: Pick<ProductsEntity, 'id' | 'inventoryStock'>[] = await this.productsRepository.find({
            where: { id: In(productIds) },
            select: { id: true, inventoryStock: true },
        });

        return rows.map((p) => ({ productId: p.id, inventoryStock: p.inventoryStock }));
    }

    // Get list of products.
    async getListOfProducts(dto: GetListOfProductRequestDto): Promise<{ products: ProductsEntity[], total: number }> {
        const { page = 1, limit = 25, search, searchBy, sortBy, sortOrder = 'asc', isActive, stockStatus } = dto;

        // Calculate the offset and limit.
        const offset = (page - 1) * limit;

        // Create the query builder.
        const qb = this.productsRepository.createQueryBuilder('products');

        // --- 1. FILTER ---
        if (isActive !== undefined && isActive !== 'all') {
            qb.andWhere('products.is_active = :activeFilter', { activeFilter: isActive === 'true' });
        }
        if (stockStatus !== undefined) {
            qb.andWhere('products.stock_status = :stockStatus', { stockStatus });
        }

        // --- 2. SEARCH ---
        if (search && searchBy) {
            if (searchBy === 'sku') {
                qb.andWhere(`products.sku ILIKE :search${WILDCARD_ILIKE_ESCAPE_SQL}`, {
                    search: buildWildcardIlikePattern(search),
                });
            } else if (searchBy === 'productName') {
                qb.andWhere(`EXISTS (
                    SELECT 1 FROM product_names pn
                    WHERE pn.product_id = products.id
                    AND pn.name ILIKE :search${WILDCARD_ILIKE_ESCAPE_SQL}
                )`, { search: buildWildcardIlikePattern(search) });
            }
        }

        // --- 3. SORT ---
        const sortDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

        const countQb = qb.clone();

        if (sortBy === 'productUnitName') {
            qb.leftJoin('products.productUnit', 'productUnit');
        }

        const applySort = (builder: SelectQueryBuilder<ProductsEntity>) => {
            if (sortBy === 'productName') {
                builder.orderBy(
                    `(SELECT MIN(pn.name) FROM product_names pn WHERE pn.product_id = products.id)`,
                    sortDirection,
                    'NULLS LAST',
                );
            } else if (sortBy === 'productUnitName') {
                builder.orderBy('productUnit.unit_name', sortDirection);
            } else {
                const sortMap: Record<string, string> = {
                    sku: 'products.sku',
                    importPrice: 'products.import_price',
                    sellingPrice: 'products.selling_price',
                    stockStatus: 'products.stock_status',
                    inventoryStock: 'products.inventory_stock',
                    createdAt: 'products.created_at',
                    updatedAt: 'products.updated_at',
                };
                const sortColumn = (sortBy ? sortMap[sortBy] : null) ?? 'products.created_at';
                builder.orderBy(sortColumn, sortDirection);
            }
            builder.addOrderBy('products.id', 'ASC');
        };

        applySort(qb);

        // --- 4. PAGINATE ---
        const idSubQuery = qb.clone()
            .select('products.id')
            .offset(offset)
            .limit(limit)
            .getQuery();

        const outerQb = this.productsRepository.createQueryBuilder('products')
            .leftJoinAndSelect('products.productNames', 'productNames')
            .leftJoinAndSelect('products.productUnit', 'productUnit')
            .where(`products.id IN (${idSubQuery})`)
            .setParameters(qb.getParameters());

        applySort(outerQb);

        const [products, total] = await Promise.all([
            outerQb.getMany(),
            countQb.getCount(),
        ]);

        return { products, total };
    }

    // Get a list of products by product unit ID.
    async getListOfProductByProductUnitId(dto: GetListOfProductByProductUnitIdRequestDto): Promise<{ products: ProductsEntity[], total: number }> {
        const { page = 1, limit = 10, productUnitId } = dto;

        const offset = (page - 1) * limit;

        const qb = this.productsRepository.createQueryBuilder('products')
            .where('products.product_unit_id = :productUnitId', { productUnitId });

        const idSubQuery = qb.clone()
            .select('products.id')
            .orderBy('products.created_at', 'DESC')
            .addOrderBy('products.id', 'ASC')
            .offset(offset)
            .limit(limit)
            .getQuery();

        const outerQb = this.productsRepository.createQueryBuilder('products')
            .leftJoinAndSelect('products.productNames', 'productNames')
            .leftJoinAndSelect('products.productUnit', 'productUnit')
            .where(`products.id IN (${idSubQuery})`)
            .setParameters(qb.getParameters())
            .orderBy('products.created_at', 'DESC')
            .addOrderBy('products.id', 'ASC');

        const [products, total] = await Promise.all([
            outerQb.getMany(),
            qb.getCount(),
        ]);

        return { products, total };
    }

    // --- Product history methods ---
    // Get a list of history versions for a product.
    async getProductHistoryList(dto: GetProductHistoryListRequestDto): Promise<{ data: ProductsHistoryEntity[], total: number }> {
        const { id: productId, page = 1, limit = 10 } = dto;
        const [data, total] = await this.productsHistoryRepository.findAndCount({
            where: { productId },
            relations: ['createdByUser'],
            select: {
                id: true,
                version: true,
                createdBy: true,
                createdAt: true,
                eventSummary: true,
                createdByUser: {
                    id: true,
                    username: true,
                },
            },
            order: { version: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }

    // Get a specific history version's data for a product.
    async getProductHistoryByVersion(productId: string, version: number): Promise<ProductsHistoryEntity | null> {
        return await this.productsHistoryRepository.findOne({
            where: { productId, version },
            relations: ['createdByUser'],
        });
    }

    // --- Stock history methods ---
    // Get a list of product stock history.
    async getProductStockHistoryList(dto: GetProductStockHistoryListRequestDto): Promise<{ data: ProductStockHistoryEntity[], total: number }> {
        const { id: productId, page = 1, limit = 10 } = dto;
        const [data, total] = await this.productStockHistoryRepository.findAndCount({
            where: { product: { id: productId } },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }

    // Get a specific product stock history by ID.
    async getProductStockHistoryById(id: string): Promise<ProductStockHistoryEntity | null> {
        return await this.productStockHistoryRepository.findOne({
            where: { id },
        });
    }

    // --- Product overview methods ---
    // Get the product overview.
    async getProductOverview(): Promise<ProductOverviewEntity> {
        await this.productOverviewRepository
            .createQueryBuilder()
            .insert()
            .into(ProductOverviewEntity)
            .values({ id: ProductsRepository.PRODUCT_OVERVIEW_ID })
            .orIgnore()
            .execute();

        return await this.productOverviewRepository.findOneOrFail({
            where: { id: ProductsRepository.PRODUCT_OVERVIEW_ID },
        });
    }
}
