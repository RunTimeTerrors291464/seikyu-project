import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { ProductUnitsEntity } from '../entities/productUnits.entity';
import { ProductUnitsHistoryEntity } from '../entities/productUnitsHistory.entity';

// Import DTOs.
import {
    CreateProductUnitRequestDto,
    EditProductUnitRequestDto,
    GetListOfProductUnitRequestDto,
} from '@libs/common/dtos/productUnits/crudProductUnitRequest.dto';
import {
    ProductUnitChangedField,
    ProductUnitChangeEventDto,
    ProductUnitSnapshotDto
} from '@libs/common/dtos/productUnits/productUnitSnapshot.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import mappers.
import { ProductUnitMapper } from '@libs/common/mappers/productUnit.mapper';

@Injectable()
export class ProductUnitsRepository {
    constructor(
        @InjectRepository(ProductUnitsEntity) private productUnitsRepository: Repository<ProductUnitsEntity>,
        @InjectRepository(ProductUnitsHistoryEntity) private productUnitsHistoryRepository: Repository<ProductUnitsHistoryEntity>,
        private readonly productUnitMapper: ProductUnitMapper,
    ) { }

    // --- DRY methods ---
    // Get the latest version number of a product unit's history.
    private async getLatestHistoryVersion(productUnitId: string, manager: EntityManager): Promise<number> {
        const latestHistory = await manager.findOne(ProductUnitsHistoryEntity, {
            where: { productUnit: { id: productUnitId } },
            order: { version: 'DESC' },
        });
        return latestHistory?.version ?? 0;
    }

    // Clean up old product unit history versions if exceeding 16 versions.
    private async cleanupOldProductUnitHistoryVersions(productUnitId: string, manager: EntityManager): Promise<void> {
        const histories = await manager.find(ProductUnitsHistoryEntity, {
            where: { productUnit: { id: productUnitId } },
            order: { version: 'ASC' },
        });

        if (histories.length > 16) {
            const toDelete = histories.slice(0, histories.length - 16);
            await manager.remove(toDelete);
        }
    }

    // --- Public methods ---
    // Create a new product unit.
    async createNewProductUnit(dto: CreateProductUnitRequestDto, user: AccessTokenPayload, manager: EntityManager): Promise<ProductUnitsEntity> {

        // Create a new product unit - ProductUnitsEntity.
        const productUnit: ProductUnitsEntity = await manager.save(ProductUnitsEntity, dto);

        // Create a snapshot.
        const snapshot: ProductUnitSnapshotDto = this.productUnitMapper.toProductUnitSnapshotDto(productUnit);

        // Create a product unit history - ProductUnitsHistoryEntity.
        await manager.save(ProductUnitsHistoryEntity, {
            productUnit: productUnit,
            version: 1,
            createdBy: user.id,
            events: [{ fieldName: ProductUnitChangedField.NEW_PRODUCT_UNIT, previousValue: null, newValue: null }],
            eventSummary: [ProductUnitChangedField.NEW_PRODUCT_UNIT],
            isSnapshot: true,
            data: snapshot,
        } as ProductUnitsHistoryEntity);

        // Return the product unit.
        return productUnit;
    }

    // Edit a product unit.
    async editProductUnit(productUnit: ProductUnitsEntity, dto: EditProductUnitRequestDto, user: AccessTokenPayload, manager: EntityManager): Promise<{
        productUnit: ProductUnitsEntity,
        history: ProductUnitsHistoryEntity,
    }> {

        // Snapshot the previous product unit.
        const previousSnapshot: ProductUnitSnapshotDto = this.productUnitMapper.toProductUnitSnapshotDto(productUnit);

        // Merge dto with product unit - ProductUnitsEntity.
        manager.merge(ProductUnitsEntity, productUnit, dto);
        const updatedProductUnit: ProductUnitsEntity = await manager.save(ProductUnitsEntity, productUnit);

        // Get the next version number.
        const nextVersion: number = await this.getLatestHistoryVersion(productUnit.id, manager) + 1;

        // Compute the changes.
        const currentSnapshot: ProductUnitSnapshotDto = this.productUnitMapper.toProductUnitSnapshotDto(updatedProductUnit);
        const changes: ProductUnitChangeEventDto[] = this.productUnitMapper.toProductUnitChangeEventDtos(previousSnapshot, currentSnapshot);
        const changeSummary: string[] = changes.map(change => change.fieldName);

        // Create a product unit history - ProductUnitsHistoryEntity.
        const isSnapshot: boolean = nextVersion % 5 === 0;
        const productUnitHistory: ProductUnitsHistoryEntity = await manager.save(ProductUnitsHistoryEntity, {
            productUnitId: productUnit.id,
            version: nextVersion,
            createdBy: user.id,
            events: changes,
            eventSummary: changeSummary,
            isSnapshot: isSnapshot,
            data: isSnapshot ? currentSnapshot : null,
        });

        // Clean up old product unit history versions if exceeding 16 versions.
        await this.cleanupOldProductUnitHistoryVersions(productUnit.id, manager);

        return { productUnit: updatedProductUnit, history: productUnitHistory };
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
        const { page = 1, limit = 25, search, isActive = 'all', sortBy, sortOrder = 'asc' } = dto;

        // Calculate the offset and limit.
        const offset = (page - 1) * limit;

        // Create the query builder.
        const qb = this.productUnitsRepository.createQueryBuilder('productUnits');

        // --- 1. FILTER ---
        if (isActive !== 'all') {
            qb.andWhere('productUnits.is_active = :activeFilter', { activeFilter: isActive === 'true' });
        }

        // --- 2. SEARCH ---
        if (search) qb.andWhere('productUnits.unit_name ILIKE :search', { search: `%${search}%` });

        // --- 3. SORT ---
        const sortDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

        const applySort = (builder: typeof qb) => {
            const sortMap: Record<string, string> = {
                unitName: 'productUnits.unit_name',
                createdAt: 'productUnits.created_at',
                updatedAt: 'productUnits.updated_at',
            };
            const sortColumn = (sortBy ? sortMap[sortBy] : null) ?? 'productUnits.created_at';
            builder.orderBy(sortColumn, sortDirection);
            builder.addOrderBy('productUnits.id', 'ASC');
        };

        applySort(qb);

        // --- 4. PAGINATE ---
        const idSubQuery = qb.clone()
            .select('productUnits.id')
            .offset(offset)
            .limit(limit)
            .getQuery();

        const outerQb = this.productUnitsRepository.createQueryBuilder('productUnits')
            .where(`productUnits.id IN (${idSubQuery})`)
            .setParameters(qb.getParameters());
        applySort(outerQb);

        const [data, total] = await Promise.all([
            outerQb.getMany(),
            qb.clone().getCount(),
        ]);

        return { data, total };
    }

    // Deactivate or activate a product unit.
    async deactivateOrActivateProductUnit(productUnit: ProductUnitsEntity, isActive: boolean, user: AccessTokenPayload, manager: EntityManager): Promise<{
        productUnit: ProductUnitsEntity,
        history: ProductUnitsHistoryEntity,
    }> {
        // Set the previous active status and set the new active status - ProductUnitsEntity.
        const previousActive: boolean = productUnit.isActive;
        productUnit.isActive = isActive;
        const updatedProductUnit: ProductUnitsEntity = await manager.save(ProductUnitsEntity, productUnit);

        // Get the next version number.
        const nextVersion: number = (await this.getLatestHistoryVersion(productUnit.id, manager)) + 1;

        // Compute the changes.
        const events: ProductUnitChangeEventDto[] = [{
            fieldName: ProductUnitChangedField.ACTIVE,
            previousValue: previousActive ? 'true' : 'false',
            newValue: isActive ? 'true' : 'false',
        }];
        const isSnapshot: boolean = nextVersion % 5 === 0;
        const currentSnapshot: ProductUnitSnapshotDto = this.productUnitMapper.toProductUnitSnapshotDto(updatedProductUnit);

        const history: ProductUnitsHistoryEntity = await manager.save(ProductUnitsHistoryEntity, {
            productUnitId: productUnit.id,
            version: nextVersion,
            createdBy: user.id,
            events,
            eventSummary: [ProductUnitChangedField.ACTIVE],
            isSnapshot,
            data: isSnapshot ? currentSnapshot : null,
        });

        // Clean up old product unit history versions if exceeding 16 versions.
        await this.cleanupOldProductUnitHistoryVersions(productUnit.id, manager);

        return { productUnit: updatedProductUnit, history };
    }

    // --- History methods ---
    // Get a list of history versions for a product unit.
    async getProductUnitHistoryList(productUnitId: string): Promise<Omit<ProductUnitsHistoryEntity, 'data' | 'events'>[]> {
        const histories = await this.productUnitsHistoryRepository.find({
            where: { productUnitId },
            order: { version: 'DESC' },
            select: {
                id: true,
                productUnitId: true,
                version: true,
                createdBy: true,
                createdAt: true,
                eventSummary: true,
                isSnapshot: true,
            },
        });
        return histories as Omit<ProductUnitsHistoryEntity, 'data' | 'events'>[];
    }

    // Get a specific history version for a product unit.
    async getProductUnitHistoryByVersion(productUnitId: string, version: number): Promise<ProductUnitsHistoryEntity | null> {
        return await this.productUnitsHistoryRepository.findOne({
            where: { productUnitId, version },
        });
    }

}