import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { LogCode, ReferenceType } from '@app/common/enums/logEnums.enum';
import { Role } from '@app/common/enums/role.enum';

export class LogResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the log',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'The role of the user',
        example: Role.ADMIN,
        enum: Role,
    })
    role: Role;

    @ApiProperty({
        description: 'The user ID who performed the action',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    actionUserId: string | null;

    @ApiProperty({
        description: 'The action performed',
        example: LogCode.CREATE_NEW_USER,
        enum: LogCode,
    })
    action: LogCode;

    @ApiPropertyOptional({
        description: 'The reference type',
        example: ReferenceType.PRODUCT,
        enum: ReferenceType,
        nullable: true,
    })
    referenceType: ReferenceType | null;

    @ApiPropertyOptional({
        description: 'The reference ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
        nullable: true,
    })
    referenceId: string | null;

    @ApiPropertyOptional({
        description: 'The metadata',
        example: {
            key: 'value',
        },
        nullable: true,
    })
    metadata: Record<string, any> | null;

    @ApiProperty({
        description: 'The timestamp when log was created',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;
}

export class GetListOfLogsResponseDto {
    @ApiProperty({
        description: 'The page number',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'The page limit',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'The total number of logs',
        example: 100,
    })
    total: number;

    @ApiProperty({
        description: 'The logs list',
        type: [LogResponseDto],
    })
    logs: LogResponseDto[];
}
