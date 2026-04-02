import { HttpStatus, Injectable } from '@nestjs/common';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

// Import entities.
import { DataSource } from 'typeorm';
import { ProductUnitsEntity } from '../entities/productUnits.entity';
import { ProductUnitsHistoryEntity } from '../entities/productUnitsHistory.entity';

// Import repositories.
import { ProductUnitsRepository } from '../repositories/productUnits.repository';
import { UsersRepository } from '../../users/repositories/users.repository';

// Import DTOs.
import {
    CreateProductUnitRequestDto,
    EditProductUnitRequestDto,
    GetListOfProductUnitRequestDto,
} from '@libs/common/dtos/productUnits/crudProductUnitRequest.dto';
import {
    GetListOfProductUnitResponseDto,
    ProductUnitResponseDto,
    ProductUnitResponseDtoWithHistory,
} from '@libs/common/dtos/productUnits/crudProductUnitResponse.dto';
import {
    GetProductUnitHistoryListRequestDto,
    GetProductUnitHistoryByVersionRequestDto,
} from '@libs/common/dtos/productUnits/crudProductUnitHistoryRequest.dto';
import {
    ProductUnitHistoryItemResponseDto,
    GetProductUnitHistoryByVersionResponseDto
} from '@libs/common/dtos/productUnits/crudProductUnitHistoryResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import mappers.
import { ProductUnitMapper } from '@libs/common/mappers/productUnit.mapper';

@Injectable()
export class ProductUnitsService {
    constructor(
        private readonly productUnitsRepository: ProductUnitsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly productUnitMapper: ProductUnitMapper,
        private readonly dataSource: DataSource,
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

    // Get the username of the user who created the product unit.
    async getCreatedByUsername(userId: string): Promise<string> {
        const user = await this.usersRepository.getUserById(userId);
        return user?.username ?? '[UNKNOWN] USER';
    }

    // --- Public methods ---
    // Create a new product unit.
    @HandleServiceError(ErrorCode.CREATE_PRODUCT_UNIT_SERVICE)
    async createNewProductUnit(dto: CreateProductUnitRequestDto, user: AccessTokenPayload): Promise<ProductUnitResponseDto> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitByUnitName(dto.unitName);
        if (productUnit) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_NAME_ALREADY_EXISTS, 'The product unit name is already taken.');

        // Create a new product unit.
        const newProductUnit: ProductUnitsEntity = await this.dataSource.transaction(async (transactionManager) => {
            const newProductUnit: ProductUnitsEntity = await this.productUnitsRepository.createNewProductUnit(dto, user, transactionManager);
            return newProductUnit;
        });

        return this.productUnitMapper.toProductUnitResponseDto(newProductUnit);
    }

    // Edit a product unit.
    @HandleServiceError(ErrorCode.EDIT_PRODUCT_UNIT_SERVICE)
    async editProductUnit(dto: EditProductUnitRequestDto, user: AccessTokenPayload): Promise<ProductUnitResponseDtoWithHistory> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitById(dto.id);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');

        // Check if the product unit name is already taken.
        if (dto.unitName) {
            const existingByName = await this.getProductUnitByUnitName(dto.unitName);
            if (existingByName && existingByName.id !== dto.id) {
                throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_UNIT_NAME_ALREADY_EXISTS, 'The product unit name is already taken.');
            }
        }

        // Edit the product unit.
        const result: { productUnit: ProductUnitsEntity, history: ProductUnitsHistoryEntity } = await this.dataSource.transaction(async (transactionManager) => {
            return this.productUnitsRepository.editProductUnit(productUnit, dto, user, transactionManager);
        });

        // Get the username of the user who created the product unit.
        const createdByUsername: string = await this.getCreatedByUsername(result.history.createdBy);
        return this.productUnitMapper.toProductUnitResponseDtoWithHistory(result.productUnit, result.history, createdByUsername);
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

    // Deactivate or activate a product unit.
    @HandleServiceError(ErrorCode.DEACTIVATE_OR_ACTIVATE_PRODUCT_UNIT_SERVICE)
    async deactivateOrActivateProductUnit(id: string, user: AccessTokenPayload, activateMode: boolean): Promise<ProductUnitResponseDtoWithHistory> {

        // Get the product unit by id.
        const productUnit: ProductUnitsEntity | null = await this.getProductUnitById(id);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');

        // Check if the product unit is already activated or deactivated.
        if (productUnit.isActive === activateMode) {
            throw new CustomException(
                HttpStatus.BAD_REQUEST,
                activateMode ? ErrorCode.PRODUCT_UNIT_ALREADY_ACTIVATED : ErrorCode.PRODUCT_UNIT_ALREADY_DEACTIVATED,
                activateMode ? 'The product unit is already activated.' : 'The product unit is already deactivated.',
            );
        }

        // Deactivate or activate the product unit with transaction manager.
        const result: { productUnit: ProductUnitsEntity; history: ProductUnitsHistoryEntity } = await this.dataSource.transaction(async (transactionManager) => {
            return this.productUnitsRepository.deactivateOrActivateProductUnit(productUnit, activateMode, user, transactionManager);
        });

        // Get the username of the user who created the product unit.   
        const createdByUsername: string = await this.getCreatedByUsername(result.history.createdBy);
        return this.productUnitMapper.toProductUnitResponseDtoWithHistory(result.productUnit, result.history, createdByUsername);
    }

    // --- History APIs ---
    // Get history list of a product unit.
    @HandleServiceError(ErrorCode.GET_PRODUCT_UNIT_HISTORY_LIST_SERVICE)
    async getProductUnitHistoryList(dto: GetProductUnitHistoryListRequestDto): Promise<ProductUnitHistoryItemResponseDto[]> {

        // Check if the product unit already exists.
        const productUnit = await this.getProductUnitById(dto.productUnitId);
        if (!productUnit) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_UNIT_NOT_FOUND, 'The product unit is not found.');

        // Get the history list.
        const historyList: ProductUnitsHistoryEntity[] = await this.productUnitsRepository.getProductUnitHistoryList(dto.productUnitId);

        return historyList.map((history) => ({
            id: history.id,
            version: history.version,
            createdBy: history.createdBy,
            createdByUsername: history.createdByUser?.username ?? '[UNKNOWN] USER',
            createdAt: history.createdAt,
            eventSummary: history.eventSummary,
        }));
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
}
