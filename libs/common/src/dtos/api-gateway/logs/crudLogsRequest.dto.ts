import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, ValidateIf, IsIn, IsDateString, IsUUID, IsEnum, IsObject, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { Role } from '@app/common/enums/role.enum';
import { LogCode, ReferenceType } from '@app/common/enums/logEnums.enum';

export class CreateLogRequestDto {
    @ApiProperty({
        description: 'The role of the user',
        example: Role.ADMIN,
    })
    @IsNotEmpty()
    @IsEnum(Role)
    role: Role;

    @ApiProperty({
        description: 'The user ID who performed the action',
        example: '550e8400-e29b-41d4-a716-446655440000'
    })
    @IsNotEmpty()
    @IsUUID()
    actionUserId: string;

    @ApiProperty({
        description: 'The action performed',
        example: LogCode.CREATE_NEW_USER,
        enum: LogCode,
    })
    @IsNotEmpty()
    @IsEnum(LogCode)
    action: LogCode;

    @ApiPropertyOptional({
        description: 'The reference type',
        example: ReferenceType.PRODUCT,
        enum: ReferenceType,
    })
    @IsOptional()
    @IsEnum(ReferenceType)
    referenceType?: ReferenceType;

    @ApiPropertyOptional({
        description: 'The reference ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID()
    referenceId?: string;

    @ApiPropertyOptional({
        description: 'The metadata',
        example: {
            key: 'value',
        },
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

}

// Get list of logs request DTO.
export class GetListOfLogsRequestDto {
    @ApiPropertyOptional({
        description: 'The page number',
        example: 1,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(2147483647)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'The page size',
        example: 10,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query (User ID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by action',
        example: LogCode.CREATE_NEW_USER,
        enum: LogCode,
    })
    @IsOptional()
    @IsEnum(LogCode)
    action?: LogCode;

    @ApiPropertyOptional({
        description: 'Filter by user roles',
        example: [Role.ADMIN, Role.MANAGER],
        enum: Role,
        isArray: true,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null) return value;
        return Array.isArray(value) ? value.map(Number) : [Number(value)];
    })
    @IsArray()
    @IsEnum(Role, { each: true })
    roles?: Role[];

    @ApiPropertyOptional({
        description: 'Sort by which field',
        example: 'createdAt',
        enum: ['createdAt'],
    })
    @IsIn(['createdAt'])
    @IsOptional()
    sortBy?: 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'desc',
        enum: ['asc', 'desc'],
    })
    @IsIn(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc';
}