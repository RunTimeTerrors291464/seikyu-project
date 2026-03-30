import { IsNotEmpty, IsString, IsArray, IsEnum, IsOptional, MaxLength, IsUUID, Min, IsNumber, Max, IsIn, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Import swagger.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import role enum.
import { Role } from '@libs/common/enums/role.enum';


// Create new user request DTO.
export class CreateNewUserRequestDto {
    @ApiProperty({
        description: 'First name of the user',
        example: 'John',
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(64, { message: 'firstName must be less than 64 characters.' })
    firstName: string;

    @ApiPropertyOptional({
        description: 'Middle name of the user',
        example: 'Smith',
        maxLength: 64,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64, { message: 'middleName must be less than 64 characters.' })
    middleName?: string;

    @ApiPropertyOptional({
        description: 'Last name of the user',
        example: 'Doe',
        maxLength: 64,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64, { message: 'lastName must be less than 64 characters.' })
    lastName?: string;

    @ApiProperty({
        description: 'Username for login',
        example: 'johndoe',
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(64, { message: 'username must be less than 64 characters.' })
    username: string;

    @ApiProperty({
        description: 'Password for the user account',
        example: 'SecurePassword123!',
        minLength: 8,
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'password must be at least 8 characters.' })
    @MaxLength(64, { message: 'password must be less than 64 characters.' })
    password: string;

    @ApiProperty({
        description: `The roles of the user:
        1 - ADMIN
        2 - MANAGER
        3 - CASHIER`,
        example: [Role.CASHIER],
        enum: Role,
        isArray: true,
    })
    @IsNotEmpty()
    @IsArray()
    @IsEnum(Role, { each: true })
    roles: Role[];
}

// Create first admin account request DTO.
export class CreateUserAdminRequestDto {

    @ApiProperty({
        description: 'First name of the user',
        example: 'John',
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(64, { message: 'firstName must be less than 64 characters.' })
    firstName: string;

    @ApiPropertyOptional({
        description: 'Middle name of the user',
        example: 'Smith',
        maxLength: 64,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64, { message: 'middleName must be less than 64 characters.' })
    middleName?: string;

    @ApiPropertyOptional({
        description: 'Last name of the user',
        example: 'Doe',
        maxLength: 64,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64, { message: 'lastName must be less than 64 characters.' })
    lastName?: string;

    @ApiProperty({
        description: 'Username for login',
        example: 'johndoe',
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(64, { message: 'username must be less than 64 characters.' })
    username: string;

    @ApiProperty({
        description: 'Password for the user account',
        example: 'SecurePassword123!',
        minLength: 8,
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'password must be at least 8 characters.' })
    @MaxLength(64, { message: 'password must be less than 64 characters.' })
    password: string;
}

// Edit user request DTO.
export class EditUserRequestDto {
    @ApiProperty({
        description: 'Unique identifier of the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiPropertyOptional({
        description: 'First name of the user',
        example: 'John',
        maxLength: 64,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64, { message: 'firstName must be less than 64 characters.' })
    firstName?: string;

    @ApiPropertyOptional({
        description: 'Middle name of the user',
        example: 'Smith',
        maxLength: 64,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64, { message: 'middleName must be less than 64 characters.' })
    middleName?: string;

    @ApiPropertyOptional({
        description: 'Last name of the user',
        example: 'Doe',
        maxLength: 64,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64, { message: 'lastName must be less than 64 characters.' })
    lastName?: string;

    @ApiPropertyOptional({
        description: 'Username',
        example: 'johndoe',
        maxLength: 64,
    })
    @IsOptional()
    @IsString()
    @MaxLength(64, { message: 'username must be less than 64 characters.' })
    username?: string;

    @ApiProperty({
        description: 'User roles',
        example: [Role.CASHIER],
        enum: Role,
        isArray: true,
    })
    @IsNotEmpty()
    @IsArray()
    @IsEnum(Role, { each: true })
    roles: Role[];
}

// Get list of users request DTO.
export class GetListOfUsersRequestDto {
    @ApiPropertyOptional({
        description: 'Page number for pagination',
        example: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(2147483647)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 25;

    @ApiPropertyOptional({
        description: 'Search keyword',
        example: 'john',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Search field: "name" or "username"',
        example: 'username',
        enum: ['fullName', 'username'],
    })
    @IsOptional()
    @IsIn(['fullName', 'username'])
    searchBy?: 'fullName' | 'username';

    @ApiPropertyOptional({
        description: 'Filter by user roles: [1, 2, 3]',
        example: [1, 2, 3],
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
        description: 'Filter by active status: "true", "false", or "all"',
        example: 'all',
        enum: ['true', 'false', 'all'],
    })
    @IsOptional()
    @IsIn(['true', 'false', 'all'])
    isActive?: 'true' | 'false' | 'all' = 'all';

    @ApiPropertyOptional({
        description: 'Sort by field',
        example: 'createdAt',
        enum: ['fullName', 'username', 'createdAt', 'updatedAt', 'isActive'],
    })
    @IsOptional()
    @IsIn(['fullName', 'username', 'createdAt', 'updatedAt', 'isActive'])
    sortBy?: 'fullName' | 'username' | 'createdAt' | 'updatedAt' | 'isActive';

    @ApiPropertyOptional({
        description: 'Sort order: "asc" or "desc"',
        example: 'desc',
        enum: ['asc', 'desc'],
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'asc';
}

// Forgot password request DTO.
export class ForgotPasswordRequestDto {
    @ApiProperty({
        description: 'Unique identifier of the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'New password',
        example: 'SecurePassword123!',
        minLength: 8,
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'password must be at least 8 characters.' })
    @MaxLength(64, { message: 'password must be less than 64 characters.' })
    password: string;
}

// User changes its password request DTO.
export class UserChangePasswordRequestDto {
    @ApiProperty({
        description: 'Current password',
        example: 'CurrentPassword123!',
        minLength: 8,
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'currentPassword must be at least 8 characters.' })
    @MaxLength(64, { message: 'currentPassword must be less than 64 characters.' })
    currentPassword: string;

    @ApiProperty({
        description: 'New password',
        example: 'NewPassword123!',
        minLength: 8,
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'newPassword must be at least 8 characters.' })
    @MaxLength(64, { message: 'newPassword must be less than 64 characters.' })
    newPassword: string;
}
