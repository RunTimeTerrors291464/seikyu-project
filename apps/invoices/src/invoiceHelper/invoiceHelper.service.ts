import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, retry, catchError, throwError } from 'rxjs';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import DTOs.
import {
    UserResponseDto,
    UserResponseWithPasswordDto
} from '@app/common/dtos/platform/users/crudUsersReponse.dto';
import {
    UpdateProductInventoryBulkRequestDto
} from '@app/common/dtos/platform/products/crudProductRequest.dto';
import { ProductResponseDto } from '@app/common/dtos/platform/products/crudProductResponse.dto';

@Injectable()
export class InvoiceHelperService {
    constructor(
        @Inject('PLATFORM_SERVICE') private platformClient: ClientProxy
    ) { }

    // Update product inventory stock in bulk.
    // Retry 3 times. If all retries fail, throw a CustomException.
    async updateProductInventoryStockBulk(dto: UpdateProductInventoryBulkRequestDto): Promise<ProductResponseDto[]> {
        return lastValueFrom(
            this.platformClient.send({ cmd: 'products.updateInventoryStockBulk' }, dto).pipe(
                retry({ count: 3, delay: 250 }),
                catchError((err) => {
                    const errorData = err?.error || err;
                    const status = errorData?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
                    const errorCode = errorData?.errorCode ?? ErrorCode.UPDATE_INVENTORY_STOCK_BULK_SERVICE;
                    const message = errorData?.message ?? 'Platform service unavailable, please try again later.';
                    const errorDetails = errorData?.errorDetails ?? null;
                    
                    return throwError(() => new CustomException(status, errorCode, `[updateProductInventoryStockBulk] ${message}`, errorDetails));
                })
            )
        );
    }

    // Check whether the productIds exist and are active.
    async checkProductIdExistsAndActive(productIds: string[]): Promise<{ success: boolean, notFound: string[], notActive: string[] }> {
        if (productIds.length === 0) return { success: true, notFound: [], notActive: [] };

        const products = await this.getProductsByIds(productIds);
        const foundIds = new Set(products.map(p => p.id));

        const notFound = productIds.filter(id => !foundIds.has(id));
        const notActive = products.filter(p => !p.isActive).map(p => p.id);

        if (!notFound.length && !notActive.length) return { success: true, notFound, notActive };
        return { success: false, notFound, notActive };
    }

    // Check whether the product SKUs exist and are active.
    async checkProductSkuExistsAndActive(skus: string[]): Promise<{ success: boolean, notFound: string[], notActive: string[], products: ProductResponseDto[] }> {
        if (skus.length === 0) return { success: true, notFound: [], notActive: [], products: [] };

        const products = await this.getProductsBySkus(skus);
        const foundSkus = new Set(products.map(p => p.sku));

        const notFound = skus.filter(sku => !foundSkus.has(sku));
        const notActive = products.filter(p => !p.isActive).map(p => p.sku);

        if (!notFound.length && !notActive.length) return { success: true, notFound, notActive, products };
        return { success: false, notFound, notActive, products: [] };
    }

    // Get user information by ID.
    async getUserById(userId: string, withPassword: boolean = false): Promise<UserResponseDto | UserResponseWithPasswordDto> {
        return lastValueFrom(
            this.platformClient.send(
                { cmd: 'users.getUserById' },
                { id: userId, withPassword }
            )
        );
    }

    // Get multiple users by their IDs.
    async getUsersByIds(userIds: string[]): Promise<UserResponseDto[]> {
        if (userIds.length === 0) return [];
        return lastValueFrom(
            this.platformClient.send(
                { cmd: 'users.getUsersByIds' },
                { ids: userIds }
            )
        );
    }

    // Get a product by ID.
    async getProductById(id: string): Promise<ProductResponseDto> {
        return lastValueFrom(
            this.platformClient.send(
                { cmd: 'products.getProductById' },
                { id }
            )
        );
    }

    // Get a product by SKU.
    async getProductBySku(sku: string): Promise<ProductResponseDto> {
        return lastValueFrom(
            this.platformClient.send(
                { cmd: 'products.getProductBySku' },
                { sku }
            )
        );
    }

    // Get multiple products by their IDs.
    async getProductsByIds(ids: string[]): Promise<ProductResponseDto[]> {
        if (ids.length === 0) return [];
        return lastValueFrom(
            this.platformClient.send(
                { cmd: 'products.getProductsByIds' },
                { ids }
            )
        );
    }

    // Get multiple products by their SKUs.
    async getProductsBySkus(skus: string[]): Promise<ProductResponseDto[]> {
        if (skus.length === 0) return [];
        return lastValueFrom(
            this.platformClient.send(
                { cmd: 'products.getProductsBySkus' },
                { skus }
            )
        );
    }
}
