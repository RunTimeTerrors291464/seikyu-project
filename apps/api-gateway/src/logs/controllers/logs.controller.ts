import { Controller, Get, Post, Body, Query, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/guards';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import services.
import { LogsService } from '../services/logs.service';

// Import DTOs.
import { CreateLogRequestDto, GetListOfLogsRequestDto } from '@app/common/dtos/api-gateway/logs/crudLogsRequest.dto';
import { GetListOfLogsResponseDto, LogResponseDto } from '@app/common/dtos/api-gateway/logs/crudLogsResponse.dto';

@ApiTags('[Logs] Logs APIs: These APIs are for logs management.')
@Controller({
    path: 'api/v1/logs',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LogsController {
    constructor(
        private readonly logsService: LogsService,
    ) { }

    // Get a list of logs.
    // GET /api/v1/logs
    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get a list of logs' })
    @ApiResponse({ status: 200, description: 'Return a list of logs.', type: GetListOfLogsResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfLogs(@Query() dto: GetListOfLogsRequestDto): Promise<GetListOfLogsResponseDto> {
        return await this.logsService.getListOfLogs(dto);
    }

    // Get a log by id.
    // GET /api/v1/logs/:id
    @Get(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: '[ADMIN] Get a log by id' })
    @ApiResponse({ status: 200, description: 'Return a log by id.', type: LogResponseDto })
    @ApiResponse({ status: 404, description: 'Log not found.' })
    @HttpCode(HttpStatus.OK)
    async getLogById(@Param('id') id: string): Promise<LogResponseDto> {
        return await this.logsService.getLogById(id);
    }
}
