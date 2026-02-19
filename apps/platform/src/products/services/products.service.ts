import { HttpStatus, Injectable } from '@nestjs/common';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import entities.
import { DataSource } from 'typeorm';
import { ProductsEntity } from '../entities/products.entity';

// Import repositories.
import { ProductsRepository } from '../repositories/products.repository';
import { ProductUnitsRepository } from '../repositories/productUnits.repository';
import { UsersRepository } from '../../users/repositories/users.repository';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
    UpdateProductInventoryBulkRequestDto,
} from '@app/common/dtos/platform/products/crudProductRequest.dto';
import {
    ProductResponseDto,
    ProductCashierResponseDto,
    GetListOfProductResponseDto,
} from '@app/common/dtos/platform/products/crudProductResponse.dto';
import {
    GetProductHistoryListRequestDto,
    GetProductHistoryByVersionRequestDto,
    ProductHistoryItemResponseDto,
    GetProductHistoryByVersionResponseDto
} from '@app/common/dtos/platform/products/history/crudProduct.dto';
import {
    GetListOfProductStockHistoryResponseDto,
    GetProductStockHistoryRequestDto,
    ProductStockHistoryResponseDto,
} from '@app/common/dtos/platform/products/history/crudProductStock.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import enums.
import { StockStatus } from '@app/common/enums/stockStatus.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';

// Import mappers.
import { ProductMapper } from '@app/common/mappers/platform/product.mapper';

@Injectable()
export class ProductsService {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly productUnitsRepository: ProductUnitsRepository,
        private readonly productMapper: ProductMapper,
        private readonly usersRepository: UsersRepository,
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

    // --- APIs ---
    // Create a new product.
    @HandleServiceError(ErrorCode.CREATE_PRODUCT_SERVICE)
    async createNewProduct(dto: CreateProductRequestDto, user: AccessTokenPayload): Promise<ProductResponseDto> {

        // Check if the product already exists.
        const product = await this.getProductBySku(dto.sku);
        if (product) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_SKU_ALREADY_EXISTS, 'The product SKU is already taken.');

        // Check if the product unit exists and active.
        const productUnit = await this.productUnitsRepository.getProductUnitById(dto.productUnitId);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');
        if (!productUnit.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_NOT_ACTIVE, 'The product unit is not active.');

        // By default, the product is out of stock.
        const stockStatus: StockStatus = StockStatus.OUT_OF_STOCK;

        // Create a new product.
        const newProduct = await this.productsRepository.createProduct(dto, stockStatus, user);
        return this.productMapper.toProductResponseDto(newProduct);
    }

    // Edit a product.
    @HandleServiceError(ErrorCode.EDIT_PRODUCT_SERVICE)
    async editProduct(dto: EditProductRequestDto, user: AccessTokenPayload): Promise<ProductResponseDto> {

        // Check if the product already exists and active.
        const product = await this.getProductById(dto.id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');
        if (!product.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, 'The product is not active.');

        // If edit the sku, check if the sku is already taken.
        if (dto.sku) {
            const product = await this.getProductBySku(dto.sku);
            if (product) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_SKU_ALREADY_EXISTS, 'The product SKU is already taken.');
        }

        // Check if the product unit exists and active.
        if (dto.productUnitId) {
            const productUnit = await this.productUnitsRepository.getProductUnitById(dto.productUnitId);
            if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');
            if (!productUnit.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_NOT_ACTIVE, 'The product unit is not active.');
        }

        // Edit the product.
        const updatedProduct = await this.productsRepository.editProduct(product, dto, user);
        return this.productMapper.toProductResponseDto(updatedProduct);
    }

    // Get a product by id.
    @HandleServiceError(ErrorCode.GET_PRODUCT_SERVICE)
    async getProductByIdResponseDto(id: string): Promise<ProductResponseDto> {
        const product = await this.getProductById(id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');
        return this.productMapper.toProductResponseDto(product);
    }

    // Get a product by sku.
    @HandleServiceError(ErrorCode.GET_PRODUCT_SERVICE)
    async getProductBySkuResponseDto(sku: string): Promise<ProductResponseDto> {
        const product = await this.getProductBySku(sku);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');
        return this.productMapper.toProductResponseDto(product);
    }

    // Get a product cashier by sku.
    @HandleServiceError(ErrorCode.GET_PRODUCT_CASHIER_SERVICE)
    async getProductCashierBySkuResponseDto(sku: string): Promise<ProductCashierResponseDto> {
        const product = await this.getProductBySku(sku);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');
        return this.productMapper.toProductCashierResponseDto(product);
    }

    // Get a list of products with pagination and filters.
    @HandleServiceError(ErrorCode.GET_PRODUCTS_SERVICE)
    async getListOfProducts(dto: GetListOfProductRequestDto): Promise<GetListOfProductResponseDto> {
        const products = await this.productsRepository.getListOfProducts(dto);

        // Count total products.
        const total = products.length;

        const productDtos: ProductResponseDto[] = products.map((product) =>
            this.productMapper.toProductResponseDto(product)
        );

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

        // Validate all products before touching the DB.
        const validatedProducts: { product: ProductsEntity, update: (typeof dto.products)[number] }[] = [];

        for (const productUpdate of dto.products) {

            // Check if the product already exists.
            const product = await this.getProductById(productUpdate.id);
            if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `The product with ID ${productUpdate.id} is not found.`);

            // Validate quantity is not negative after the operation.
            if (productUpdate.action === StockActionType.SUBTRACT && product.inventoryStock < productUpdate.quantity) {
                throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_STOCK_CANNOT_BE_NEGATIVE, `Insufficient inventory to subtract for Product ID ${productUpdate.id}.`);
            }

            validatedProducts.push({ product, update: productUpdate });
        }

        // Run all updates inside a single transaction.
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const results: ProductResponseDto[] = [];

            for (const { product, update } of validatedProducts) {
                const updatedProduct = await this.productsRepository.updateInventoryStock(
                    product,
                    update.quantity,
                    update.action,
                    dto.invoiceType,
                    dto.invoiceId,
                    queryRunner.manager,
                );
                results.push(this.productMapper.toProductResponseDto(updatedProduct));
            }

            await queryRunner.commitTransaction();
            return results;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UPDATE_INVENTORY_STOCK_BULK_SERVICE, 'Failed to update product inventory stock.');
        } finally {
            await queryRunner.release();
        }
    }

    // Activate a product.
    @HandleServiceError(ErrorCode.ACTIVATE_PRODUCT_SERVICE)
    async activateProduct(id: string, user: AccessTokenPayload): Promise<ProductResponseDto> {

        // Check if the product already exists.
        const product = await this.getProductById(id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        // Check if the product is already activated.
        if (product.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_ALREADY_ACTIVATED, 'The product is already activated.');

        // Activate the product.
        const updatedProduct = await this.productsRepository.activateProduct(product, user);
        return this.productMapper.toProductResponseDto(updatedProduct);
    }

    // Deactivate a product.
    @HandleServiceError(ErrorCode.DEACTIVATE_PRODUCT_SERVICE)
    async deactivateProduct(id: string, user: AccessTokenPayload): Promise<ProductResponseDto> {

        // Check if the product already exists.
        const product = await this.getProductById(id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        // Check if the product is already deactivated.
        if (!product.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_ALREADY_DEACTIVATED, 'The product is already deactivated.');

        // Deactivate the product.
        const updatedProduct = await this.productsRepository.deactivateProduct(product, user);
        return this.productMapper.toProductResponseDto(updatedProduct);
    }

    // --- History APIs ---
    // Get history list of a product.
    @HandleServiceError(ErrorCode.GET_PRODUCT_HISTORY_LIST_SERVICE)
    async getProductHistoryList(dto: GetProductHistoryListRequestDto): Promise<ProductHistoryItemResponseDto[]> {

        // Check if the product already exists.
        const product = await this.getProductById(dto.id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        // Get the history list.
        const historyList = await this.productsRepository.getProductHistoryList(dto.id);

        // Get the username of the user who created each history entry.
        const historyWithUsernames = await Promise.all(
            historyList.map(async (history) => {
                const userResult = await this.usersRepository.getUserById(history.createdBy);
                const createdByUsername = userResult ? userResult[0].username : '[UNKNOWN] USER';

                return {
                    id: history.id,
                    version: history.version,
                    createdBy: history.createdBy,
                    createdByUsername,
                    createdAt: history.createdAt,
                };
            })
        );

        return historyWithUsernames;
    }

    // Get a specific history version of a product.
    @HandleServiceError(ErrorCode.GET_PRODUCT_HISTORY_BY_VERSION_SERVICE)
    async getProductHistoryByVersion(dto: GetProductHistoryByVersionRequestDto): Promise<GetProductHistoryByVersionResponseDto> {

        // Check if the product already exists.
        const product = await this.getProductById(dto.id);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        // Get the history by version.
        const history = await this.productsRepository.getProductHistoryByVersion(dto.id, dto.version);
        if (!history) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `The product version ${dto.version} is not found.`);

        // Get the username of the user who created this version.
        const userResult = await this.usersRepository.getUserById(history.createdBy);
        const createdByUsername = userResult ? userResult[0].username : '[UNKNOWN] USER';

        // Return the history response.
        return {
            id: history.id,
            version: history.version,
            createdBy: history.createdBy,
            createdByUsername,
            data: history.data,
            createdAt: history.createdAt,
        };
    }

    // --- Product Stock History APIs ---
    // Get stock history list of a product.
    @HandleServiceError(ErrorCode.GET_PRODUCT_STOCK_HISTORY_LIST_SERVICE)
    async getProductStockHistoryList(dto: GetProductStockHistoryRequestDto): Promise<GetListOfProductStockHistoryResponseDto> {

        // Check if the product already exists.
        const product = await this.getProductById(dto.productId);
        if (!product) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, 'The product is not found.');

        // Get the stock history list.
        const { data, total } = await this.productsRepository.getProductStockHistoryList(dto.productId);

        const historyList: ProductStockHistoryResponseDto[] = data.map(history => ({
            id: history.id,
            productId: history.product.id,
            quantityType: history.quantityType,
            quantity: history.quantity,
            referenceType: history.referenceType,
            referenceId: history.referenceId,
            beforeInventoryStock: history.beforeInventoryStock,
            afterInventoryStock: history.afterInventoryStock,
            createdAt: history.createdAt,
        }));

        return {
            page: 1,
            limit: 10,
            total,
            products: historyList,
        };
    }

    // Get a specific stock history by id.
    @HandleServiceError(ErrorCode.GET_PRODUCT_STOCK_HISTORY_BY_ID_SERVICE)
    async getProductStockHistoryById(id: string): Promise<ProductStockHistoryResponseDto> {
        const history = await this.productsRepository.getProductStockHistoryById(id);
        if (!history) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_STOCK_HISTORY_NOT_FOUND, 'The stock history record is not found.');

        return {
            id: history.id,
            productId: history.product.id,
            quantityType: history.quantityType,
            quantity: history.quantity,
            referenceType: history.referenceType,
            referenceId: history.referenceId,
            beforeInventoryStock: history.beforeInventoryStock,
            afterInventoryStock: history.afterInventoryStock,
            createdAt: history.createdAt,
        };
    }
}
