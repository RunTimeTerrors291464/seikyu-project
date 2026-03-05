import { HttpStatus, Injectable } from '@nestjs/common';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import entities.
import { ProductUnitsEntity } from '../entities/productUnits.entity';

// Import repositories.
import { ProductUnitsRepository } from '../repositories/productUnits.repository';
import { UsersRepository } from '../../users/repositories/users.repository';

// Import DTOs.
import {
    CreateProductUnitRequestDto,
    EditProductUnitRequestDto,
    GetListOfProductUnitRequestDto,
} from '@app/common/dtos/platform/products/crudProductUnitRequest.dto';
import { GetListOfProductUnitResponseDto, ProductUnitResponseDto } from '@app/common/dtos/platform/products/crudProductunitResponse.dto';
import {
    GetProductUnitHistoryListRequestDto,
    GetProductUnitHistoryByVersionRequestDto,
    ProductUnitHistoryItemResponseDto,
    GetProductUnitHistoryByVersionResponseDto
} from '@app/common/dtos/platform/products/history/crudProductUnit.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import mappers.
import { ProductUnitMapper } from '@app/common/mappers/platform/productUnit.mapper';


@Injectable()
export class ProductUnitsService {
    constructor(
        private readonly productUnitsRepository: ProductUnitsRepository,
        private readonly productUnitMapper: ProductUnitMapper,
        private readonly usersRepository: UsersRepository,
    ) { }

    // --- DRY methods ---
    // Check if the product unit already exists.
    async getProductUnitByUnitName(unitName: string): Promise<ProductUnitsEntity | null> {
        const productUnit = await this.productUnitsRepository.getProductUnitByUnitName(unitName);
        if (!productUnit) return null;
        return productUnit;
    }

    // Check if the product unit already exists by id.
    async getProductUnitById(id: string): Promise<ProductUnitsEntity | null> {
        const productUnit = await this.productUnitsRepository.getProductUnitById(id);
        if (!productUnit) return null;
        return productUnit;
    }

    // --- APIs ---
    // Create a new product unit.
    @HandleServiceError(ErrorCode.CREATE_PRODUCT_UNIT_SERVICE)
    async createNewProductUnit(dto: CreateProductUnitRequestDto, user: AccessTokenPayload): Promise<ProductUnitResponseDto> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitByUnitName(dto.unitName);
        if (productUnit) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_NAME_ALREADY_EXISTS, 'The product unit name is already taken.');

        // Create a new product unit.
        const newProductUnit = await this.productUnitsRepository.createNewProductUnit(dto, user);
        return this.productUnitMapper.toProductUnitResponseDto(newProductUnit);
    }

    // Edit a product unit.
    @HandleServiceError(ErrorCode.EDIT_PRODUCT_UNIT_SERVICE)
    async editProductUnit(dto: EditProductUnitRequestDto, user: AccessTokenPayload): Promise<ProductUnitResponseDto> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitById(dto.id);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');

        // Check if the product unit name is already taken.
        if (dto.unitName) {
            const productUnit = await this.getProductUnitByUnitName(dto.unitName);
            if (productUnit) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_NAME_ALREADY_EXISTS, 'The product unit name is already taken.');
        }

        // Edit the product unit.
        const updatedProductUnit = await this.productUnitsRepository.editProductUnit(productUnit, dto, user);
        return this.productUnitMapper.toProductUnitResponseDto(updatedProductUnit);
    }

    // Get a product unit by id.
    @HandleServiceError(ErrorCode.GET_PRODUCT_UNIT_BY_ID_SERVICE)
    async getProductUnitByIdResponseDto(id: string): Promise<ProductUnitResponseDto> {
        const productUnit = await this.getProductUnitById(id);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');
        return this.productUnitMapper.toProductUnitResponseDto(productUnit);
    }

    // Get a list of product units.
    @HandleServiceError(ErrorCode.GET_LIST_OF_PRODUCT_UNITS_SERVICE)
    async getListOfProductUnits(dto: GetListOfProductUnitRequestDto): Promise<GetListOfProductUnitResponseDto> {
        const { data, total } = await this.productUnitsRepository.getListOfProductUnits(dto);
        const productUnits: ProductUnitResponseDto[] = data.map((productUnit) => this.productUnitMapper.toProductUnitResponseDto(productUnit));
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            productUnits,
        };
    }

    // Deactivate a product unit.
    @HandleServiceError(ErrorCode.DEACTIVATE_PRODUCT_UNIT_SERVICE)
    async deactivateProductUnit(id: string, user: AccessTokenPayload): Promise<ProductUnitResponseDto> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitById(id);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');

        // Check if the product unit is already deactivated.
        if (!productUnit.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_ALREADY_DEACTIVATED, 'The product unit is already deactivated.');

        // Deactivate the product unit.
        const updatedProductUnit = await this.productUnitsRepository.deactivateProductUnit(productUnit, user);
        return this.productUnitMapper.toProductUnitResponseDto(updatedProductUnit);
    }

    // Activate a product unit.
    @HandleServiceError(ErrorCode.ACTIVATE_PRODUCT_UNIT_SERVICE)
    async activateProductUnit(id: string, user: AccessTokenPayload): Promise<ProductUnitResponseDto> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitById(id);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');

        // Check if the product unit is already activated.
        if (productUnit.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_ALREADY_ACTIVATED, 'The product unit is already activated.');

        // Activate the product unit.
        const updatedProductUnit = await this.productUnitsRepository.activateProductUnit(productUnit, user);
        return this.productUnitMapper.toProductUnitResponseDto(updatedProductUnit);
    }

    // --- History APIs ---
    // Get history list of a product unit.
    @HandleServiceError(ErrorCode.GET_PRODUCT_UNIT_HISTORY_LIST_SERVICE)
    async getProductUnitHistoryList(dto: GetProductUnitHistoryListRequestDto): Promise<ProductUnitHistoryItemResponseDto[]> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitById(dto.productUnitId);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');

        // Get the history list.
        const historyList = await this.productUnitsRepository.getProductUnitHistoryList(dto.productUnitId);

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
                    eventSummary: history.eventSummary,
                };
            })
        );

        return historyWithUsernames;
    }

    // Get a specific history version of a product unit.
    @HandleServiceError(ErrorCode.GET_PRODUCT_UNIT_HISTORY_BY_VERSION_SERVICE)
    async getProductUnitHistoryByVersion(dto: GetProductUnitHistoryByVersionRequestDto): Promise<GetProductUnitHistoryByVersionResponseDto> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitById(dto.productUnitId);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');

        // Get the history by version.
        const history = await this.productUnitsRepository.getProductUnitHistoryByVersion(dto.productUnitId, dto.version);
        if (!history) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, `The product unit version ${dto.version} is not found.`);

        // Get the username of the user who created this version.
        const userResult = await this.usersRepository.getUserById(history.createdBy);
        const createdByUsername = userResult ? userResult[0].username : '[UNKNOWN] USER';

        // Return the history response.
        return {
            id: history.id,
            version: history.version,
            createdBy: history.createdBy,
            createdByUsername,
            createdAt: history.createdAt,
            events: history.events,
            eventSummary: history.eventSummary,
            isSnapshot: history.isSnapshot,
            data: history.data,
        };
    }


}
