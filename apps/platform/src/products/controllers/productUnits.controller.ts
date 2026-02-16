import { Controller } from '@nestjs/common';

// Import TCP message pattern.
import { MessagePattern } from '@nestjs/microservices';

// Import services.
import { ProductUnitsService } from '../services/productUnits.service';

// Import DTOs.
import {
    CreateProductUnitRequestDto,
    EditProductUnitRequestDto,
    GetListOfProductUnitRequestDto,
} from '@app/common/dtos/platform/products/crudProductUnitRequest.dto';
import {
    ProductUnitResponseDto,
    GetListOfProductUnitResponseDto,
} from '@app/common/dtos/platform/products/crudProductunitResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import {
    GetProductUnitHistoryByVersionRequestDto,
    GetProductUnitHistoryListRequestDto,
    ProductUnitHistoryItemResponseDto,
    GetProductUnitHistoryByVersionResponseDto,
} from '@app/common/dtos/platform/products/history/crudProductUnit.dto';

@Controller()
export class ProductUnitsController {
    constructor(
        private readonly productUnitsService: ProductUnitsService
    ) { }

    // Create a product unit.
    @MessagePattern({ cmd: 'products.createProductUnit' })
    async createProductUnit(data: { dto: CreateProductUnitRequestDto; user: AccessTokenPayload }): Promise<ProductUnitResponseDto> {
        return this.productUnitsService.createNewProductUnit(data.dto, data.user);
    }

    // Edit a product unit.
    @MessagePattern({ cmd: 'products.editProductUnit' })
    async editProductUnit(data: { dto: EditProductUnitRequestDto; user: AccessTokenPayload }): Promise<ProductUnitResponseDto> {
        return this.productUnitsService.editProductUnit(data.dto, data.user);
    }

    // Get a product unit by id.
    @MessagePattern({ cmd: 'products.getProductUnitById' })
    async getProductUnitById(data: { id: string }): Promise<ProductUnitResponseDto> {
        return this.productUnitsService.getProductUnitByIdResponseDto(data.id);
    }

    // Get a list of product units.
    @MessagePattern({ cmd: 'products.getListOfProductUnits' })
    async getListOfProductUnits(dto: GetListOfProductUnitRequestDto): Promise<GetListOfProductUnitResponseDto> {
        return this.productUnitsService.getListOfProductUnits(dto);
    }

    // Deactivate a product unit.
    @MessagePattern({ cmd: 'products.deactivateProductUnit' })
    async deactivateProductUnit(data: { id: string; user: AccessTokenPayload }): Promise<ProductUnitResponseDto> {
        return this.productUnitsService.deactivateProductUnit(data.id, data.user);
    }

    // Activate a product unit.
    @MessagePattern({ cmd: 'products.activateProductUnit' })
    async activateProductUnit(data: { id: string; user: AccessTokenPayload }): Promise<ProductUnitResponseDto> {
        return this.productUnitsService.activateProductUnit(data.id, data.user);
    }

    // --- History APIs ---
    // Get history list of a product unit.
    @MessagePattern({ cmd: 'products.getProductUnitHistoryList' })
    async getProductUnitHistoryList(dto: GetProductUnitHistoryListRequestDto): Promise<ProductUnitHistoryItemResponseDto[]> {
        return this.productUnitsService.getProductUnitHistoryList(dto);
    }

    // Get a specific history version of a product unit.
    @MessagePattern({ cmd: 'products.getProductUnitHistoryByVersion' })
    async getProductUnitHistoryByVersion(dto: GetProductUnitHistoryByVersionRequestDto): Promise<GetProductUnitHistoryByVersionResponseDto> {
        return this.productUnitsService.getProductUnitHistoryByVersion(dto);
    }
}
