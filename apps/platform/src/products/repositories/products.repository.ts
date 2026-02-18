import { Injectable } from '@nestjs/common';
import { Repository, In, ILike } from 'typeorm';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { ProductsEntity } from '../entities/products.entity';
import { ProductNamesEntity } from '../entities/productNames.entity';
import { ProductsHistoryEntity } from '../entities/history/productsHistory.entity';
import { ProductStockHistoryEntity } from '../entities/history/productStockHistory.entity';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
} from '@app/common/dtos/platform/products/crudProductRequest.dto';
import {
    CreateProductStockRequestDto,
} from '@app/common/dtos/platform/products/history/crudProductStock.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import enums.
import { StockStatus } from '@app/common/enums/stockStatus.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

// Import mappers.
import { ProductMapper } from '@app/common/mappers/platform/product.mapper';

@Injectable()
export class ProductsRepository {
    constructor(
        @InjectRepository(ProductsEntity) private productsRepository: Repository<ProductsEntity>,
        @InjectRepository(ProductNamesEntity) private productNamesRepository: Repository<ProductNamesEntity>,
        @InjectRepository(ProductsHistoryEntity) private productsHistoryRepository: Repository<ProductsHistoryEntity>,
        @InjectRepository(ProductStockHistoryEntity) private productStockHistoryRepository: Repository<ProductStockHistoryEntity>,
        private readonly productMapper: ProductMapper,
    ) { }

    // --- DRY methods ---
    // Get the latest version number of a product's history.
    private async getLatestHistoryVersion(id: string, transactionalManager?: any): Promise<number> {
        const manager = transactionalManager || this.productsHistoryRepository;
        const latestHistory = await manager.findOne(ProductsHistoryEntity, {
            where: { product: { id } },
            order: { version: 'DESC' },
        });
        return latestHistory?.version ?? 0;
    }

    // Clean up old product history versions if exceeding 10 versions.
    private async cleanupOldProductHistoryVersions(id: string, transactionalManager?: any): Promise<void> {
        const manager = transactionalManager || this.productsHistoryRepository;
        const histories = await manager.find(ProductsHistoryEntity, {
            where: { product: { id } },
            order: { version: 'ASC' },
        });

        // If more than 10 versions, delete the oldest ones.
        if (histories.length > 10) {
            const toDelete = histories.slice(0, histories.length - 10);
            await manager.remove(toDelete);
        }
    }
    // Clean up old product stock history if exceeding 10 records.
    private async cleanupOldProductStockHistory(productId: string, transactionalManager: any): Promise<void> {
        const histories = await transactionalManager.find(ProductStockHistoryEntity, {
            where: { product: { id: productId } },
            order: { createdAt: 'ASC' },
        });

        if (histories.length > 10) {
            const toDelete = histories.slice(0, histories.length - 10);
            await transactionalManager.remove(ProductStockHistoryEntity, toDelete);
        }
    }

    // --- APIs ---
    // Create a new product.
    async createProduct(dto: CreateProductRequestDto, stockStatus: StockStatus, user: AccessTokenPayload): Promise<ProductsEntity> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            const { productNames, productUnitId, ...productData } = dto;

            // Create product entity with productUnitId mapped to product_unit column.
            const productEntity: ProductsEntity = this.productsRepository.create({
                ...productData,
                productUnit: { id: productUnitId },
            });

            productEntity.stockStatus = stockStatus;

            // Save product first.
            const savedProductEntity: ProductsEntity = await transactionalManager.save(ProductsEntity, productEntity);

            // Create and save product names.
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

            // Create a new product history.
            await transactionalManager.save(ProductsHistoryEntity, {
                product: productToReturn,
                version: 1,
                createdBy: user.id,
                data: this.productMapper.toProductSnapshotDto(productToReturn),
            } as ProductsHistoryEntity);

            return productToReturn;
        });
    }

    // Edit a product.
    async editProduct(productEntity: ProductsEntity, dto: EditProductRequestDto, user: AccessTokenPayload): Promise<ProductsEntity> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            const { productName, productUnitId, ...productData } = dto;

            if (productUnitId) {
                productData['productUnit'] = { id: productUnitId };
            }

            // Merge product data without productName.
            this.productsRepository.merge(productEntity, productData);
            const updatedProductEntity: ProductsEntity = await transactionalManager.save(ProductsEntity, productEntity);

            // Update product names if provided.
            if (productName !== undefined) {
                // Delete existing product names.
                await transactionalManager.delete(ProductNamesEntity, { product: { id: productEntity.id } });

                // Create and save new product names if array is not empty.
                if (productName.length > 0) {
                    const productNameEntities = productName.map(name =>
                        this.productNamesRepository.create({ name, product: updatedProductEntity })
                    );
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

            // Get the latest version from history using transactionalManager.
            const currentVersion = await this.getLatestHistoryVersion(productEntity.id, transactionalManager);
            const nextVersion = currentVersion + 1;

            // Create a new product history entry.
            await transactionalManager.save(ProductsHistoryEntity, {
                product: productToReturn,
                version: nextVersion,
                createdBy: user.id,
                data: this.productMapper.toProductSnapshotDto(productToReturn),
            } as ProductsHistoryEntity);

            // Clean up old product history versions if exceeding 10.
            await this.cleanupOldProductHistoryVersions(productEntity.id, transactionalManager);

            return productToReturn;
        });
    }

    // Update the inventory stock of a product with stock history.
    async updateInventoryStock(
        productEntity: ProductsEntity,
        quantity: number,
        action: StockActionType,
        referenceType: any,
        referenceId: string,
    ): Promise<ProductsEntity> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            const beforeInventoryStock = productEntity.inventoryStock;

            // Update product stock.
            if (action === StockActionType.ADD) productEntity.inventoryStock += quantity;
            else if (action === StockActionType.SUBTRACT) productEntity.inventoryStock -= quantity;
            const afterInventoryStock = productEntity.inventoryStock;

            // Update stock status.
            if (productEntity.inventoryStock <= 0) productEntity.stockStatus = StockStatus.OUT_OF_STOCK;
            else if (productEntity.reorderThreshold !== null && productEntity.inventoryStock <= productEntity.reorderThreshold) productEntity.stockStatus = StockStatus.REORDER_THRESHOLD_REACHED;
            else productEntity.stockStatus = StockStatus.IN_STOCK;

            await transactionalManager.save(ProductsEntity, productEntity);

            // Load all relations in one query.
            const productWithRelations = await transactionalManager.findOne(ProductsEntity, {
                where: { id: productEntity.id },
                relations: ['productUnit', 'productNames'],
            });
            const productToReturn = productWithRelations || productEntity;

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
            await transactionalManager.save(ProductStockHistoryEntity, history);
            await this.cleanupOldProductStockHistory(productEntity.id, transactionalManager);

            return productToReturn;
        });
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

    // Get a list of products.
    async getListOfProducts(dto: GetListOfProductRequestDto): Promise<ProductsEntity[]> {
        const { page = 1, limit = 10, search, searchBy, sortBy, sortOrder = 'asc', active, stockStatus } = dto;

        // Create query builder.
        const queryBuilder = this.productsRepository.createQueryBuilder('product');
        queryBuilder.leftJoinAndSelect('product.productUnit', 'productUnit');

        // Handle productName search separately.
        let filterBySku: string[] | null = null;
        if (search && searchBy === 'productName') {
            const matchingNames = await this.productNamesRepository.find({
                where: { name: ILike(`%${search}%`) },
                relations: ['product'],
            });
            filterBySku = [...new Set(matchingNames.map(n => n.product.sku))];

            if (filterBySku.length === 0) {
                return [];
            }
            queryBuilder.andWhere('product.sku IN (:...skus)', { skus: filterBySku });
        }

        // Apply other search filters.
        if (search && searchBy && searchBy !== 'productName') {
            if (searchBy === 'sku') {
                queryBuilder.andWhere('product.sku ILIKE :search', { search: `${search}%` });

            } else if (searchBy === 'importPrice') {
                const searchNum = parseFloat(search);
                if (!isNaN(searchNum)) {
                    queryBuilder.andWhere(
                        'product.importPrice >= :minPrice AND product.importPrice <= :maxPrice',
                        { minPrice: searchNum, maxPrice: searchNum + 1 }
                    );
                }

            } else if (searchBy === 'sellingPrice') {
                const searchNum = parseFloat(search);
                if (!isNaN(searchNum)) {
                    queryBuilder.andWhere(
                        'product.sellingPrice >= :minPrice AND product.sellingPrice <= :maxPrice',
                        { minPrice: searchNum, maxPrice: searchNum + 1 }
                    );
                }
            }
        }

        // Apply active filter.
        if (active !== undefined && active !== 'all') {
            const isActive = active === 'true';
            queryBuilder.andWhere('product.active = :active', { active: isActive });
        }

        // Apply stock status filter.
        if (stockStatus !== undefined && stockStatus !== 'all') {
            const status = parseInt(stockStatus);
            if (!isNaN(status)) {
                queryBuilder.andWhere('product.stockStatus = :stockStatus', { stockStatus: status });
            }
        }

        // Apply sorting.
        const sortField = sortBy === 'unit' ? 'productUnit.unitName'
            : sortBy === 'importPrice' ? 'product.importPrice'
                : sortBy === 'sellingPrice' ? 'product.sellingPrice'
                    : sortBy === 'createdAt' ? 'product.createdAt'
                        : sortBy === 'updatedAt' ? 'product.updatedAt'
                            : sortBy === 'sku' ? 'product.sku'
                                : 'product.createdAt';
        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        const products = await queryBuilder.getMany();

        // Load productNames separately.
        if (products.length > 0) {
            const ids = products.map(p => p.id);
            const productNames = await this.productNamesRepository.find({
                where: { product: { id: In(ids) } },
                relations: ['product'],
            });

            // Map names to products.
            const namesMap = new Map<string, ProductNamesEntity[]>();
            productNames.forEach(name => {
                if (!namesMap.has(name.product.id)) {
                    namesMap.set(name.product.id, []);
                }
                namesMap.get(name.product.id)!.push(name);
            });

            products.forEach(product => {
                product.productNames = namesMap.get(product.id) || [];
            });
        }

        // Return product entities.
        return products;
    }

    // Activate a product.
    async activateProduct(productEntity: ProductsEntity, user: AccessTokenPayload): Promise<ProductsEntity> {
        return await this.productsRepository.manager.transaction(async (transactionalManager) => {
            productEntity.active = true;
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

            // Create a new product history entry.
            await transactionalManager.save(ProductsHistoryEntity, {
                product: productToReturn,
                version: nextVersion,
                createdBy: user.id,
                data: this.productMapper.toProductSnapshotDto(productToReturn),
            } as ProductsHistoryEntity);

            // Clean up old product history versions if exceeding 10.
            await this.cleanupOldProductHistoryVersions(productEntity.id, transactionalManager);

            return productToReturn;
        });
    }

    // Deactivate a product.
    async deactivateProduct(productEntity: ProductsEntity, user: AccessTokenPayload): Promise<ProductsEntity> {
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

            // Create a new product history entry.
            await transactionalManager.save(ProductsHistoryEntity, {
                product: productToReturn,
                version: nextVersion,
                createdBy: user.id,
                data: this.productMapper.toProductSnapshotDto(productToReturn),
            } as ProductsHistoryEntity);

            // Clean up old product history versions if exceeding 10.
            await this.cleanupOldProductHistoryVersions(productEntity.id, transactionalManager);

            return productToReturn;
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

            // Clean up old product stock history if exceeding 10.
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

}
