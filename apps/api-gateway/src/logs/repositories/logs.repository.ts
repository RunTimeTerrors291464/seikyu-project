import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import entities.
import { LogsEntity } from '../entities/logs.entity';

// Import DTOs.
import {
    CreateLogRequestDto,
    GetListOfLogsRequestDto
} from '@app/common/dtos/api-gateway/logs/crudLogsRequest.dto';

@Injectable()
export class LogsRepository {
    constructor(
        @InjectRepository(LogsEntity) private logsRepository: Repository<LogsEntity>,
    ) { }

    // Create a new log.
    async createLog(dto: CreateLogRequestDto): Promise<LogsEntity> {
        return await this.logsRepository.manager.transaction(async (transactionalManager) => {
            const newLog = this.logsRepository.create({
                role: dto.role,
                actionUserId: dto.actionUserId,
                action: dto.action,
                referenceType: dto.referenceType ?? null,
                referenceId: dto.referenceId ?? null,
                metadata: dto.metadata ?? null,
            });

            return await transactionalManager.save(LogsEntity, newLog);
        });
    }

    // Get a log by id.
    async getLogById(id: string): Promise<LogsEntity | null> {
        return await this.logsRepository.findOne({
            where: { id }
        });
    }

    // Get list of logs.
    async getListOfLogs(dto: GetListOfLogsRequestDto): Promise<{ data: LogsEntity[], total: number }> {
        const { page = 1, limit = 10, search, action, roles, sortBy, sortOrder = 'desc' } = dto;

        const queryBuilder = this.logsRepository.createQueryBuilder('log');

        // Apply search filters.
        if (search) {
            queryBuilder.andWhere('log.actionUserId = :search', { search });
        }

        // Apply action filter.
        if (action) {
            queryBuilder.andWhere('log.action = :action', { action });
        }

        // Apply roles filter.
        if (roles && roles.length > 0) {
            queryBuilder.andWhere('log.role IN (:...roles)', { roles });
        }

        // Apply sorting.
        let sortField = 'log.createdAt';
        if (sortBy === 'createdAt') sortField = 'log.createdAt';

        queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }

    // Remove all the logs that are older than 30 days.
    async deleteLogsOlderThan30Days(): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await this.logsRepository
            .createQueryBuilder()
            .delete()
            .from(LogsEntity)
            .where('createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
            .execute();

        return result.affected ?? 0;
    }
}
