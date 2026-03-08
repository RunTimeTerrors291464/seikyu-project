import { HttpStatus, Injectable } from '@nestjs/common';

// Import repositories.
import { LogsRepository } from '../repositories/logs.repository';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import DTOs.
import { CreateLogRequestDto } from '@app/common/dtos/api-gateway/logs/crudLogsRequest.dto';
import { GetListOfLogsRequestDto } from '@app/common/dtos/api-gateway/logs/crudLogsRequest.dto';
import { GetListOfLogsResponseDto, LogResponseDto } from '@app/common/dtos/api-gateway/logs/crudLogsResponse.dto';

@Injectable()
export class LogsService {
    constructor(private readonly logsRepository: LogsRepository) { }

    // Create a new log.
    async createLog(dto: CreateLogRequestDto): Promise<LogResponseDto> {
        const log = await this.logsRepository.createLog(dto);

        return {
            id: log.id,
            role: log.role,
            actionUserId: log.actionUserId,
            action: log.action,
            referenceType: log.referenceType,
            referenceId: log.referenceId,
            metadata: log.metadata,
            createdAt: log.createdAt,
        };
    }

    // Get a log by id.
    async getLogById(id: string): Promise<LogResponseDto> {

        const log = await this.logsRepository.getLogById(id);
        if (!log) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.LOG_NOT_FOUND, 'Log not found.');

        return {
            id: log.id,
            role: log.role,
            actionUserId: log.actionUserId,
            action: log.action,
            referenceType: log.referenceType,
            referenceId: log.referenceId,
            metadata: log.metadata,
            createdAt: log.createdAt,
        };
    }

    // Get a list of logs.
    async getListOfLogs(dto: GetListOfLogsRequestDto): Promise<GetListOfLogsResponseDto> {
        const { data, total } = await this.logsRepository.getListOfLogs(dto);

        const logs = data.map(log => ({
            id: log.id,
            role: log.role,
            actionUserId: log.actionUserId,
            action: log.action,
            referenceType: log.referenceType,
            referenceId: log.referenceId,
            createdAt: log.createdAt,
        }));

        return {
            page: dto.page ?? 1,
            limit: dto.limit ?? 10,
            total,
            logs,
        };
    }
}
