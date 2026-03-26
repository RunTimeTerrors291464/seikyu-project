import { Controller } from '@nestjs/common';

// Import TCP message pattern.
import { MessagePattern, Payload } from '@nestjs/microservices';

// Import services.
import { ProductsService } from '../services/products.service';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
    GetListOfProductByProductUnitIdRequestDto,
    UpdateProductInventoryRequestDto,
    UpdateProductInventoryBulkRequestDto,
} from '@app/common/dtos/platform/products/crudProductRequest.dto';
import {
    GetListOfProductResponseDto,
    ProductResponseDto,
    ProductCashierResponseDto,
    ProductResponseDtoWithHistory,
} from '@app/common/dtos/platform/products/crudProductResponse.dto';
import {
    GetProductHistoryListRequestDto,
    GetProductHistoryByVersionRequestDto,
    ProductHistoryItemResponseDto,
    GetProductHistoryByVersionResponseDto
} from '@app/common/dtos/platform/products/history/crudProduct.dto';
import {
    CreateProductStockRequestDto,
    GetListOfProductStockHistoryResponseDto,
    GetProductStockHistoryRequestDto,
    ProductStockHistoryResponseDto,
} from '@app/common/dtos/platform/products/history/crudProductStock.dto';
import { ProductOverviewResponseDto } from '@app/common/dtos/platform/products/productOverviewReponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

@Controller()
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService
    ) { }

    // Create a product.
    @MessagePattern({ cmd: 'products.createProduct' })
    async createProduct(@Payload() data: { dto: CreateProductRequestDto, user: AccessTokenPayload }): Promise<ProductResponseDto> {
        return this.productsService.createNewProduct(data.dto, data.user);
    }

    // Edit a product.
    @MessagePattern({ cmd: 'products.editProduct' })
    async editProduct(@Payload() data: { dto: EditProductRequestDto, user: AccessTokenPayload }): Promise<ProductResponseDtoWithHistory> {
        return this.productsService.editProduct(data.dto, data.user);
    }

    // Get a product by id.
    @MessagePattern({ cmd: 'products.getProductById' })
    async getProductById(data: { id: string }): Promise<ProductResponseDto> {
        return this.productsService.getProductByIdResponseDto(data.id);
    }

    // Get a product by sku.
    @MessagePattern({ cmd: 'products.getProductBySku' })
    async getProductBySku(data: { sku: string }): Promise<ProductResponseDto> {
        return this.productsService.getProductBySkuResponseDto(data.sku);
    }

    // Get a product cashier by sku.
    @MessagePattern({ cmd: 'products.getProductCashierBySku' })
    async getProductCashierBySku(data: { sku: string }): Promise<ProductCashierResponseDto> {
        return this.productsService.getProductCashierBySkuResponseDto(data.sku);
    }

    // Get a list of products.
    @MessagePattern({ cmd: 'products.getListOfProducts' })
    async getListOfProducts(dto: GetListOfProductRequestDto): Promise<GetListOfProductResponseDto> {
        return this.productsService.getListOfProducts(dto);
    }

    // Get a list of products by product unit id.
    @MessagePattern({ cmd: 'products.getListOfProductByProductUnitId' })
    async getListOfProductByProductUnitId(dto: GetListOfProductByProductUnitIdRequestDto): Promise<GetListOfProductResponseDto> {
        return this.productsService.getListOfProductByProductUnitId(dto);
    }

    // Update product inventory stock in bulk.
    @MessagePattern({ cmd: 'products.updateInventoryStockBulk' })
    async updateInventoryStockBulk(@Payload() dto: UpdateProductInventoryBulkRequestDto): Promise<ProductResponseDto[]> {
        return this.productsService.updateProductInventoryBulk(dto);
    }

    // Activate a product.
    @MessagePattern({ cmd: 'products.activateProduct' })
    async activateProduct(@Payload() data: { id: string, user: AccessTokenPayload }): Promise<ProductResponseDtoWithHistory> {
        return this.productsService.activateProduct(data.id, data.user);
    }

    // Deactivate a product.
    @MessagePattern({ cmd: 'products.deactivateProduct' })
    async deactivateProduct(@Payload() data: { id: string, user: AccessTokenPayload }): Promise<ProductResponseDtoWithHistory> {
        return this.productsService.deactivateProduct(data.id, data.user);
    }

    // --- History APIs ---
    // Get history list of a product.
    @MessagePattern({ cmd: 'products.getProductHistoryList' })
    async getProductHistoryList(dto: GetProductHistoryListRequestDto): Promise<ProductHistoryItemResponseDto[]> {
        return this.productsService.getProductHistoryList(dto);
    }

    // Get a specific history version of a product.
    @MessagePattern({ cmd: 'products.getProductHistoryByVersion' })
    async getProductHistoryByVersion(dto: GetProductHistoryByVersionRequestDto): Promise<GetProductHistoryByVersionResponseDto> {
        return this.productsService.getProductHistoryByVersion(dto);
    }
    
    // --- Product Stock History APIs ---
    // Get stock history list of a product.
    @MessagePattern({ cmd: 'products.getProductStockHistoryList' })
    async getProductStockHistoryList(dto: GetProductStockHistoryRequestDto): Promise<GetListOfProductStockHistoryResponseDto> {
        return this.productsService.getProductStockHistoryList(dto);
    }

    // --- Product Overview APIs ---
    // Get the product overview.
    @MessagePattern({ cmd: 'products.getProductOverview' })
    async getProductOverview(): Promise<ProductOverviewResponseDto | null> {
        return this.productsService.getProductOverview();
    }
}
