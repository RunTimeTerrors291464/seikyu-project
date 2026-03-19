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
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

@Injectable()
export class InvoiceHelperService {
    constructor(
        @Inject('PLATFORM_SERVICE') private platformClient: ClientProxy
    ) { }

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
        const users = await Promise.all(
            userIds.map(id => this.getUserById(id, false))
        );
        return users as UserResponseDto[];
    }

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

    // Check whether the productId exists and active.
    async checkProductIdExistsAndActive(productIds: string[]): Promise<{ success: boolean, notFound: string[], notActive: string[] }> {
        const notFound: string[] = [];
        const notActive: string[] = [];

        const products = await Promise.all(
            productIds.map(id => this.getProductById(id).catch(() => null))
        );

        products.forEach((product, index) => {
            const id = productIds[index];
            if (!product) notFound.push(id);
            else if (!product.isActive) notActive.push(id);
        });

        if (!notFound.length && !notActive.length) return { success: true, notFound, notActive };
        return { success: false, notFound, notActive };
    }


    // Check whether the product SKU exists and is active.
    async checkProductSkuExistsAndActive(skus: string[]): Promise<{ success: boolean, notFound: string[], notActive: string[], products: ProductResponseDto[] }> {
        const notFound: string[] = [];
        const notActive: string[] = [];

        const products = await Promise.all(
            skus.map(sku => this.getProductBySku(sku).catch(() => null))
        );

        products.forEach((product, index) => {
            const sku = skus[index];
            if (!product) notFound.push(sku);
            else if (!product.isActive) notActive.push(sku);
        });

        if (!notFound.length && !notActive.length) return { success: true, notFound, notActive, products: products as ProductResponseDto[] };
        return { success: false, notFound, notActive, products: [] };
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

    // Get a product by sku.
    async getProductBySku(sku: string): Promise<ProductResponseDto> {
        return lastValueFrom(
            this.platformClient.send(
                { cmd: 'products.getProductBySku' },
                { sku }
            )
        );
    }
}
