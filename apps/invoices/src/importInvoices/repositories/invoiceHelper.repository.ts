import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

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
export class InvoiceHelperRepository {
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
    async updateProductInventoryStockBulk(dto: UpdateProductInventoryBulkRequestDto): Promise<ProductResponseDto[]> {
        return lastValueFrom(
            this.platformClient.send(
                { cmd: 'products.updateInventoryStockBulk' },
                { dto }
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
