import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { ProductUnitsEntity } from '../entities/productUnits.entity';
import { ProductUnitsHistoryEntity } from '../entities/history/productUnitsHistory.entity';

// Import DTOs.
import {
    CreateProductUnitRequestDto,
    EditProductUnitRequestDto,
    GetListOfProductUnitRequestDto,
} from '@app/common/dtos/platform/products/crudProductUnitRequest.dto';
import { ProductUnitChangedField } from '@app/common/dtos/platform/products/history/snapshot/productUnitSnapshot.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import mappers.
import { ProductUnitMapper } from '@app/common/mappers/platform/productUnit.mapper';

@Injectable()
export class ProductUnitsRepository {
    constructor(
        @InjectRepository(ProductUnitsEntity) private productUnitsRepository: Repository<ProductUnitsEntity>,
        @InjectRepository(ProductUnitsHistoryEntity) private productUnitsHistoryRepository: Repository<ProductUnitsHistoryEntity>,
        private readonly productUnitMapper: ProductUnitMapper,
    ) { }

    // --- DRY methods ---
    // Get the latest version number of a product unit's history.
    private async getLatestHistoryVersion(productUnitId: string, transactionalManager?: any): Promise<number> {
        const manager = transactionalManager || this.productUnitsHistoryRepository;
        const latestHistory = await manager.findOne(ProductUnitsHistoryEntity, {
            where: { productUnit: { id: productUnitId } },
            order: { version: 'DESC' },
        });
        return latestHistory?.version ?? 0;
    }

    // Clean up old product unit history versions if exceeding 16 versions.
    private async cleanupOldProductUnitHistoryVersions(productUnitId: string, transactionalManager?: any): Promise<void> {
        const manager = transactionalManager || this.productUnitsHistoryRepository;
        const histories = await manager.find(ProductUnitsHistoryEntity, {
            where: { productUnit: { id: productUnitId } },
            order: { version: 'ASC' },
        });

        if (histories.length > 16) {
            const toDelete = histories.slice(0, histories.length - 16);
            await manager.remove(toDelete);
        }
    }

    // --- APIs ---
    // Create a new product unit.
    async createNewProductUnit(dto: CreateProductUnitRequestDto, user: AccessTokenPayload): Promise<ProductUnitsEntity> {
        return await this.productUnitsRepository.manager.transaction(async (transactionalManager) => {
            const productUnit: ProductUnitsEntity = await transactionalManager.save(ProductUnitsEntity, dto);

            // Create a new product unit snapshot.
            const newSnapshot = this.productUnitMapper.toProductUnitSnapshotDto(productUnit);

            // Create a new product unit history.
            await transactionalManager.save(ProductUnitsHistoryEntity, {
                productUnit: productUnit,
                version: 1,
                createdBy: user.id,
                events: [{ fieldName: ProductUnitChangedField.NEW_PRODUCT_UNIT, previousValue: null, newValue: null }],
                eventSummary: [ProductUnitChangedField.NEW_PRODUCT_UNIT],
                isSnapshot: true,
                data: newSnapshot,
            } as ProductUnitsHistoryEntity);

            // Return the product unit.
            return productUnit;
        });
    }

    // Edit a product unit.
    async editProductUnit(productUnit: ProductUnitsEntity, dto: EditProductUnitRequestDto, user: AccessTokenPayload): Promise<{
        productUnit: ProductUnitsEntity,
        history: ProductUnitsHistoryEntity,
    }> {
        return await this.productUnitsRepository.manager.transaction(async (transactionalManager) => {

            // Snapshot state BEFORE changes to compute change events later.
            const previousSnapshot = this.productUnitMapper.toProductUnitSnapshotDto(productUnit);

            // Merge product unit data.
            this.productUnitsRepository.merge(productUnit, dto);
            const updatedProductUnit = await transactionalManager.save(ProductUnitsEntity, productUnit);

            // Get the next version number.
            const currentVersion = await this.getLatestHistoryVersion(productUnit.id, transactionalManager);
            const nextVersion = currentVersion + 1;

            // Compute change events by comparing previous vs current snapshot.
            const currentSnapshot = this.productUnitMapper.toProductUnitSnapshotDto(updatedProductUnit);
            const events = this.productUnitMapper.toProductUnitChangeEventDtos(previousSnapshot, currentSnapshot);
            const eventSummary = events.map(e => e.fieldName);

            const isSnapshot = nextVersion % 5 === 0;

            const newHistory = await transactionalManager.save(ProductUnitsHistoryEntity, {
                productUnit: updatedProductUnit,
                version: nextVersion,
                createdBy: user.id,
                events,
                eventSummary,
                isSnapshot,
                data: isSnapshot ? currentSnapshot : null,
            } as ProductUnitsHistoryEntity);

            // Clean up old product unit history versions if exceeding 16 versions.
            await this.cleanupOldProductUnitHistoryVersions(productUnit.id, transactionalManager);

            return { productUnit: updatedProductUnit, history: newHistory };
        });
    }

    // Get a product unit by id.
    async getProductUnitById(id: string): Promise<ProductUnitsEntity | null> {
        const productUnit = await this.productUnitsRepository.findOne({ where: { id } });
        if (!productUnit) return null;
        return productUnit;
    }

    // Get a product unit by unit name.
    async getProductUnitByUnitName(unitName: string): Promise<ProductUnitsEntity | null> {
        const productUnit = await this.productUnitsRepository.findOne({ where: { unitName } });
        if (!productUnit) return null;
        return productUnit;
    }

    // Get a list of product units.
    async getListOfProductUnits(dto: GetListOfProductUnitRequestDto): Promise<{ data: ProductUnitsEntity[], total: number }> {
        const { page = 1, limit = 10, search, isActive = 'all', sortBy, sortOrder = 'asc' } = dto;

        // Create query builder.
        const queryBuilder = this.productUnitsRepository.createQueryBuilder('productUnit');

        if (search) {
            queryBuilder.andWhere('productUnit.unitName ILIKE :search', {
                search: `%${search}%`,
            });
        }

        // Apply active status filter.
        if (isActive && isActive !== 'all') {
            queryBuilder.andWhere('productUnit.active = :active', {
                active: isActive === 'true',
            });
        }

        // Apply sorting.
        const sortField = sortBy === 'unitName' ? 'productUnit.unitName'
            : sortBy === 'createdAt' ? 'productUnit.createdAt'
                : sortBy === 'updatedAt' ? 'productUnit.updatedAt' : 'productUnit.createdAt';
        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Get total count before pagination.
        const total = await queryBuilder.getCount();

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        // Execute query.
        const productUnitsEntities = await queryBuilder.getMany();

        // Return product units entities.
        return { data: productUnitsEntities, total };
    }

    // Deactivate a product unit.
    async deactivateProductUnit(productUnit: ProductUnitsEntity, user: AccessTokenPayload): Promise<{
        productUnit: ProductUnitsEntity,
        history: ProductUnitsHistoryEntity,
    }> {
        return await this.productUnitsRepository.manager.transaction(async (transactionalManager) => {

            productUnit.active = false;
            const updatedProductUnit = await transactionalManager.save(ProductUnitsEntity, productUnit);

            const currentVersion = await this.getLatestHistoryVersion(productUnit.id, transactionalManager);
            const nextVersion = currentVersion + 1;

            const events = [{ fieldName: ProductUnitChangedField.ACTIVE, previousValue: 'true', newValue: 'false' }];
            const eventSummary = [ProductUnitChangedField.ACTIVE];
            const isSnapshot = nextVersion % 5 === 0;

            const newHistory = await transactionalManager.save(ProductUnitsHistoryEntity, {
                productUnit: updatedProductUnit,
                version: nextVersion,
                createdBy: user.id,
                events,
                eventSummary,
                isSnapshot,
                data: isSnapshot ? this.productUnitMapper.toProductUnitSnapshotDto(updatedProductUnit) : null,
            } as ProductUnitsHistoryEntity);

            await this.cleanupOldProductUnitHistoryVersions(productUnit.id, transactionalManager);

            return { productUnit: updatedProductUnit, history: newHistory };
        });
    }

    // Activate a product unit.
    async activateProductUnit(productUnit: ProductUnitsEntity, user: AccessTokenPayload): Promise<{
        productUnit: ProductUnitsEntity,
        history: ProductUnitsHistoryEntity,
    }> {
        return await this.productUnitsRepository.manager.transaction(async (transactionalManager) => {

            productUnit.active = true;
            const updatedProductUnit = await transactionalManager.save(ProductUnitsEntity, productUnit);

            const currentVersion = await this.getLatestHistoryVersion(productUnit.id, transactionalManager);
            const nextVersion = currentVersion + 1;

            const events = [{ fieldName: ProductUnitChangedField.ACTIVE, previousValue: 'false', newValue: 'true' }];
            const eventSummary = [ProductUnitChangedField.ACTIVE];
            const isSnapshot = nextVersion % 5 === 0;

            const newHistory = await transactionalManager.save(ProductUnitsHistoryEntity, {
                productUnit: updatedProductUnit,
                version: nextVersion,
                createdBy: user.id,
                events,
                eventSummary,
                isSnapshot,
                data: isSnapshot ? this.productUnitMapper.toProductUnitSnapshotDto(updatedProductUnit) : null,
            } as ProductUnitsHistoryEntity);

            await this.cleanupOldProductUnitHistoryVersions(productUnit.id, transactionalManager);

            return { productUnit: updatedProductUnit, history: newHistory };
        });
    }

    // --- History APIs ---
    // Get a list of history versions for a product unit.
    async getProductUnitHistoryList(productUnitId: string): Promise<Omit<ProductUnitsHistoryEntity, 'data' | 'events'>[]> {
        const queryBuilder = this.productUnitsHistoryRepository.createQueryBuilder('history');

        queryBuilder.where('history.productUnit.id = :productUnitId', { productUnitId });

        // Sort by version descending.
        queryBuilder.orderBy('history.version', 'DESC');

        // Execute query and select fields except 'data'.
        const histories = await queryBuilder
            .select([
                'history.id',
                'history.version',
                'history.createdBy',
                'history.createdAt',
                'history.eventSummary',
            ])
            .getMany();

        return histories as Omit<ProductUnitsHistoryEntity, 'data' | 'events'>[];
    }

    // Get a specific history version's data for a product unit.
    async getProductUnitHistoryByVersion(productUnitId: string, version: number): Promise<ProductUnitsHistoryEntity | null> {
        const history = await this.productUnitsHistoryRepository.findOne({
            where: {
                productUnit: { id: productUnitId },
                version: version,
            },
        });
        return history || null;
    }
}