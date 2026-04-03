import { HttpStatus, Injectable } from '@nestjs/common';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

// Import entities.
import { DataSource } from 'typeorm';
import { ProductsEntity } from '../entities/products.entity';
import { ProductsHistoryEntity } from '../entities/productsHistory.entity';
import { ProductUnitsEntity } from '@src/productUnits/entities/productUnits.entity';

// Import repositories.
import { ProductsRepository } from '@src/products/repositories/products.repository';
import { ProductUnitsRepository } from '@src/productUnits/repositories/productUnits.repository';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
    GetListOfProductByProductUnitIdRequestDto,
    UpdateProductInventoryBulkRequestDto,
} from '@libs/common/dtos/products/crudProductRequest.dto';
import {
    ProductResponseDto,
    ProductCashierResponseDto,
    ProductResponseDtoWithHistory,
    GetListOfProductResponseDto,
    ProductInventoryStockItemResponseDto,
} from '@libs/common/dtos/products/crudProductResponse.dto';
import {
    GetProductHistoryListRequestDto,
    GetProductHistoryByVersionRequestDto,
    GetProductStockHistoryListRequestDto,
} from '@libs/common/dtos/products/crudProductHistoryRequest.dto';
import {
    ProductHistoryItemResponseDto,
    GetListOfProductHistoryResponseDto,
    GetProductHistoryByVersionResponseDto,
    ProductStockHistoryResponseDto,
    GetListOfProductStockHistoryResponseDto,
    ProductOverviewResponseDto,
} from '@libs/common/dtos/products/crudProductHistoryResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import enums.
import { StockStatus } from '@libs/common/enums/stockStatus.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';

// Import mappers.
import { ProductMapper } from '@libs/common/mappers/product.mapper';

@Injectable()
export class ProductsService {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly productUnitsRepository: ProductUnitsRepository,

        private readonly productMapper: ProductMapper,
        private readonly dataSource: DataSource,
    ) { }

    // --- DRY methods ---
    // Check if the product already exists and active by sku.
    async getProductBySku(sku: string): Promise<ProductsEntity | null> {
        const product = await this.productsRepository.getProductBySku(sku);
        if (!product) return null;
        return product;
    }

    // Check if the product already exists and active by id.
    async getProductById(id: string): Promise<ProductsEntity | null> {
        const product = await this.productsRepository.getProductById(id);
        if (!product) return null;
        return product;
    }

    // Check if the product unit exists and active by id.
    async checkProductUnitExistsAndActive(productUnitId: string): Promise<ProductUnitsEntity> {
        const productUnit: ProductUnitsEntity | null = await this.productUnitsRepository.getProductUnitById(productUnitId);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');
        if (!productUnit.isActive) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_NOT_ACTIVE, 'The product unit is not active.');
        return productUnit;
    }

    // Check if the product names has maximum 8 items.
    async checkProductNamesHasMaximum8Items(productNames: string[]): Promise<void> {
        if (productNames.length > 8) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_PRODUCT_NAMES, 'The product names has maximum 8 items.');
    }

    // --- Public methods ---
    // Create a new product.
    @HandleServiceError(ErrorCode.CREATE_PRODUCT_SERVICE)
    async createNewProduct(dto: CreateProductRequestDto, user: AccessTokenPayload): Promise<ProductResponseDto> {

        // Check if the product exists.
        const product = await this.getProductBySku(dto.sku);
        if (product) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_SKU_ALREADY_EXISTS, 'The product SKU is already taken.');

        // Check if the product unit exists and active.
        await this.checkProductUnitExistsAndActive(dto.productUnitId);

        // Check if the product names has maximum 8 items.
        await this.checkProductNamesHasMaximum8Items(dto.productNames);

        // Create a new product.
        const newProduct: ProductsEntity = await this.dataSource.transaction(async (transactionManager) => {
            const newProduct: ProductsEntity = await this.productsRepository.createNewProduct(dto, user, transactionManager);
            return newProduct;
        });

        return this.productMapper.toProductResponseDto(newProduct);
    }

    // Edit a product.
    @HandleServiceError(ErrorCode.EDIT_PRODUCT_SERVICE)
    async editProduct(dto: EditProductRequestDto, user: AccessTokenPayload): Promise<ProductResponseDtoWithHistory> {

        // Check if the product exists and is active.
        const product: ProductsEntity | null = await this.getProductById(dto.id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');
        if (!product.isActive) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, 'The product is not active.');

        // If editing the SKU, check if it is already taken by another product.
        if (dto.sku) {
            const existingProduct: ProductsEntity | null = await this.getProductBySku(dto.sku);
            if (existingProduct) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_SKU_ALREADY_EXISTS, 'The product SKU is already taken.');
        }

        // If editing the product names, check if it has maximum 8 items.
        if (dto.productNames) await this.checkProductNamesHasMaximum8Items(dto.productNames);

        // If editing the product unit, check if it exists and is active.
        if (dto.productUnitId) await this.checkProductUnitExistsAndActive(dto.productUnitId);

        // Edit the product.
        const updatedProduct = await this.dataSource.transaction(async (transactionManager) => {
            return await this.productsRepository.editProduct(product, dto, user, transactionManager);
        });

        return this.productMapper.toProductResponseDtoWithHistory(updatedProduct.product, updatedProduct.history);
    }

    // Deactivate or activate a product.
    @HandleServiceError(ErrorCode.DEACTIVATE_OR_ACTIVATE_PRODUCT_SERVICE)
    async deactivateOrActivateProduct(id: string, user: AccessTokenPayload, activateMode: boolean): Promise<ProductResponseDtoWithHistory> {

        // Check if the product exists.
        const product: ProductsEntity | null = await this.getProductById(id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        // Check if the product is already activated or deactivated.
        if (product.isActive === activateMode) {
            throw new CustomException(
                HttpStatus.BAD_REQUEST,
                activateMode ? ErrorCode.PRODUCT_ALREADY_ACTIVATED : ErrorCode.PRODUCT_ALREADY_DEACTIVATED,
                activateMode ? 'The product is already activated.' : 'The product is already deactivated.',
            );
        }

        // Deactivate or activate the product with transaction manager.
        const result: { product: ProductsEntity; history: ProductsHistoryEntity } = await this.dataSource.transaction(async (transactionManager) => {
            return this.productsRepository.deactivateOrActivateProduct(product, activateMode, user, transactionManager);
        });

        return this.productMapper.toProductResponseDtoWithHistory(result.product, result.history);
    }

    // Get a product by id.
    @HandleServiceError(ErrorCode.GET_PRODUCT_SERVICE)
    async getProductByIdResponseDto(id: string): Promise<ProductResponseDto> {
        const product: ProductsEntity | null = await this.getProductById(id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');
        return this.productMapper.toProductResponseDto(product);
    }

    // Get a product by sku.
    @HandleServiceError(ErrorCode.GET_PRODUCT_SERVICE)
    async getProductBySkuResponseDto(sku: string): Promise<ProductResponseDto> {
        const product: ProductsEntity | null = await this.getProductBySku(sku);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');
        return this.productMapper.toProductResponseDto(product);
    }

    // Get multiple products by their ids.
    @HandleServiceError(ErrorCode.GET_PRODUCT_SERVICE)
    async getProductsByIds(ids: string[]): Promise<ProductResponseDto[]> {
        const products: ProductsEntity[] = await this.productsRepository.getProductsByIds(ids);
        const foundIds: Set<string> = new Set(products.map((p) => p.id));
        const notFoundProductIds: string[] = ids.filter((id) => !foundIds.has(id));
        if (notFoundProductIds.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'One or more products were not found.', { productIds: [...new Set(notFoundProductIds)] });
        return products.map((product) => this.productMapper.toProductResponseDto(product));
    }

    // Get multiple products by their SKUs.
    @HandleServiceError(ErrorCode.GET_PRODUCT_SERVICE)
    async getProductsBySkus(skus: string[]): Promise<ProductResponseDto[]> {
        const products: ProductsEntity[] = await this.productsRepository.getProductsBySkus(skus);
        const foundSkus: Set<string> = new Set(products.map((p) => p.sku));
        const notFoundSkus: string[] = skus.filter((sku) => !foundSkus.has(sku));
        if (notFoundSkus.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'One or more products were not found.', { skus: [...new Set(notFoundSkus)] });
        return products.map((product) => this.productMapper.toProductResponseDto(product));
    }

    // Get a product cashier by sku.
    @HandleServiceError(ErrorCode.GET_PRODUCT_CASHIER_SERVICE)
    async getProductCashierBySkuResponseDto(sku: string): Promise<ProductCashierResponseDto> {
        const product: ProductsEntity | null = await this.getProductBySku(sku);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');
        return this.productMapper.toProductCashierResponseDto(product);
    }

    // Get bulk product's inventory stock by product id.
    @HandleServiceError(ErrorCode.GET_PRODUCT_SERVICE)
    async getBulkProductInventoryStock(productIds: string[]): Promise<ProductInventoryStockItemResponseDto[]> {
        
        // Check if the product ids are not more than 64.
        if (productIds.length > 64) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_PRODUCT_IDS, 'The product ids are not more than 64.');

        // Get the bulk product's inventory stock by product id.
        const stockItems: { productId: string, inventoryStock: number }[] = await this.productsRepository.getBulkProductInventoryStock(productIds);
        
        const foundIds: Set<string> = new Set(stockItems.map((item) => item.productId));
        
        const notFoundProductIds: string[] = productIds.filter((id) => !foundIds.has(id));
        if (notFoundProductIds.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'One or more products were not found.', { productIds: [...new Set(notFoundProductIds)] });
        return stockItems;
    }

    // Get a list of products with pagination and filters.
    @HandleServiceError(ErrorCode.GET_PRODUCTS_SERVICE)
    async getListOfProducts(dto: GetListOfProductRequestDto): Promise<GetListOfProductResponseDto> {
        const { products, total } = await this.productsRepository.getListOfProducts(dto);
        const productDtos: ProductResponseDto[] = products.map((product) => this.productMapper.toProductResponseDto(product));
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            products: productDtos,
        };
    }

    // Get a list of products with specific product unit id.
    @HandleServiceError(ErrorCode.GET_PRODUCTS_SERVICE)
    async getListOfProductByProductUnitId(dto: GetListOfProductByProductUnitIdRequestDto): Promise<GetListOfProductResponseDto> {
        const { products, total } = await this.productsRepository.getListOfProductByProductUnitId(dto);
        const productDtos: ProductResponseDto[] = products.map((product) => this.productMapper.toProductResponseDto(product));
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            products: productDtos,
        };
    }
    
    // Update product inventory stock bulk.
    @HandleServiceError(ErrorCode.UPDATE_INVENTORY_STOCK_BULK_SERVICE)
    async updateProductInventoryBulk(dto: UpdateProductInventoryBulkRequestDto): Promise<ProductResponseDto[]> {

        return await this.dataSource.transaction(async (transactionManager) => {
            const notFoundProductIds: string[] = [];
            const inactiveProductIds: string[] = [];
            const negativeStockProductIds: string[] = [];
            const validatedProducts: { product: ProductsEntity, update: (typeof dto.products)[number] }[] = [];

            // Sort by ID before locking to prevent deadlock when concurrent transactions.
            const sortedProducts = [...dto.products].sort((a, b) => a.id.localeCompare(b.id));

            for (const productUpdate of sortedProducts) {

                // Use SELECT FOR UPDATE to lock the row inside the transaction - Pessimistic locking.
                const product = await transactionManager.findOne(ProductsEntity, {
                    where: { id: productUpdate.id },
                    lock: { mode: 'pessimistic_write' },
                }); 

                // Check if the product is not found or inactive.
                if (!product) {
                    notFoundProductIds.push(productUpdate.id);
                    continue;
                }

                if (!product.isActive) {
                    inactiveProductIds.push(productUpdate.id);
                    continue;
                }

                // Check if the quantity is not negative after the operation.
                if (productUpdate.action === StockActionType.SUBTRACT && product.inventoryStock < productUpdate.quantity) negativeStockProductIds.push(productUpdate.id);
                validatedProducts.push({ product, update: productUpdate });
            }

            if (notFoundProductIds.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'One or more products were not found.', { productIds: [...new Set(notFoundProductIds)] });
            if (inactiveProductIds.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, 'One or more products are not active and cannot have inventory updated.', { productIds: inactiveProductIds });
            if (negativeStockProductIds.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_STOCK_CANNOT_BE_NEGATIVE, 'One or more products would have negative stock when subtracted.', { productIds: negativeStockProductIds });

            const results: ProductResponseDto[] = [];

            for (const { product, update } of validatedProducts) {
                const updatedProduct = await this.productsRepository.updateInventoryStock(
                    product,
                    update.quantity,
                    update.action,
                    dto.invoiceType,
                    dto.invoiceId,
                    transactionManager,
                );
                results.push(this.productMapper.toProductResponseDto(updatedProduct));
            }

            return results;
        });
    }

    // --- History APIs ---
    // Get history list of a product.
    @HandleServiceError(ErrorCode.GET_PRODUCT_HISTORY_LIST_SERVICE)
    async getProductHistoryList(dto: GetProductHistoryListRequestDto): Promise<GetListOfProductHistoryResponseDto> {

        const product: ProductsEntity | null = await this.getProductById(dto.id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        const { data, total } = await this.productsRepository.getProductHistoryList(dto);

        const historyItems: ProductHistoryItemResponseDto[] = data.map((history) => ({
            id: history.id,
            version: history.version,
            createdBy: history.createdBy,
            createdByUsername: history.createdByUser?.username ?? '[UNKNOWN] USER',
            createdAt: history.createdAt,
            eventSummary: history.eventSummary,
        }));

        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            history: historyItems,
        };
    }

    // Get a specific history version of a product.
    @HandleServiceError(ErrorCode.GET_PRODUCT_HISTORY_BY_VERSION_SERVICE)
    async getProductHistoryByVersion(dto: GetProductHistoryByVersionRequestDto): Promise<GetProductHistoryByVersionResponseDto> {

        const product: ProductsEntity | null = await this.getProductById(dto.id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        const history: ProductsHistoryEntity | null = await this.productsRepository.getProductHistoryByVersion(dto.id, dto.version);
        if (!history) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `The product version ${dto.version} is not found.`);

        return {
            id: history.id,
            version: history.version,
            createdBy: history.createdBy,
            createdByUsername: history.createdByUser?.username ?? '[UNKNOWN] USER',
            createdAt: history.createdAt,
            events: history.events,
            eventSummary: history.eventSummary,
            isSnapshot: history.isSnapshot,
            data: history.data,
        };
    }

    // --- Product stock history APIs ---
    // Get stock history list of a product.
    @HandleServiceError(ErrorCode.GET_PRODUCT_STOCK_HISTORY_LIST_SERVICE)
    async getProductStockHistoryList(dto: GetProductStockHistoryListRequestDto): Promise<GetListOfProductStockHistoryResponseDto> {

        const product: ProductsEntity | null = await this.getProductById(dto.id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        const { data, total } = await this.productsRepository.getProductStockHistoryList(dto);

        const stockHistory: ProductStockHistoryResponseDto[] = data.map((history) => ({
            id: history.id,
            productId: history.productId,
            quantityType: history.quantityType,
            quantity: history.quantity,
            invoiceType: history.invoiceType,
            invoiceId: history.invoiceId,
            beforeInventoryStock: history.beforeInventoryStock,
            afterInventoryStock: history.afterInventoryStock,
            createdAt: history.createdAt,
        }));

        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            stockHistory,
        };
    }

    // --- Product overview APIs ---
    // Get the product overview.
    @HandleServiceError(ErrorCode.GET_PRODUCT_OVERVIEW_SERVICE)
    async getProductOverview(): Promise<ProductOverviewResponseDto> {
        const overview = await this.productsRepository.getProductOverview();
        return {
            id: overview.id,
            totalProducts: overview.totalProducts,
            inStock: overview.inStock,
            lowStock: overview.lowStock,
            outOfStock: overview.outOfStock,
            inventoryValue: Number(overview.inventoryValue),
            updatedAt: overview.updatedAt,
        };
    }
}