import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../enums/role.enum';

// User response without password DTO.
export class UserResponseDto {
    @ApiProperty({
        description: 'Unique identifier of the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'First name of the user',
        example: 'John',
    })
    firstName: string;

    @ApiProperty({
        description: 'Middle name of the user',
        example: 'Smith',
    })
    middleName?: string;

    @ApiProperty({
        description: 'Last name of the user',
        example: 'Doe',
    })
    lastName?: string;

    @ApiProperty({
        description: 'Username',
        example: 'johndoe',
    })
    username: string;

    @ApiProperty({
        description: 'User roles',
        example: [Role.CASHIER],
        enum: Role,
        isArray: true,
    })
    roles: Role[];

    @ApiProperty({
        description: 'User active status',
        example: true,
    })
    active: boolean;

    @ApiProperty({
        description: 'User creation timestamp',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'User last update timestamp',
        example: '2024-01-15T10:30:00Z',
    })
    updatedAt: Date;
}

// User response with password DTO.
export class UserResponseWithPasswordDto {
    @ApiProperty({
        description: 'Unique identifier of the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'First name of the user',
        example: 'John',
    })
    firstName: string;

    @ApiProperty({
        description: 'Middle name of the user',
        example: 'Smith',
    })
    middleName?: string;

    @ApiProperty({
        description: 'Last name of the user',
        example: 'Doe',
    })
    lastName?: string;

    @ApiProperty({
        description: 'Username',
        example: 'johndoe',
    })
    username: string;

    @ApiProperty({
        description: 'Hashed password',
        example: 'Hashed password',
    })
    password: string;

    @ApiProperty({
        description: 'User roles',
        example: ['CASHIER'],
        enum: Role,
        isArray: true,
    })
    roles: Role[];

    @ApiProperty({
        description: 'User active status',
        example: true,
    })
    active: boolean;

    @ApiProperty({
        description: 'User creation timestamp',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'User last update timestamp',
        example: '2024-01-15T10:30:00Z',
    })
    updatedAt: Date;
}

// User response for search method DTO.
export class UserResponseForSearchResponseDto {
    @ApiProperty({
        description: 'Unique identifier of the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'Username',
        example: 'johndoe',
    })
    username: string;
}

// Get list of users response DTO.
export class GetListOfUsersResponseDto {
    @ApiProperty({
        description: 'Current page number',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'Items per page',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'Total number of users',
        example: 50,
    })
    total: number;

    @ApiProperty({
        description: 'List of users',
        type: [UserResponseDto],
    })
    users: UserResponseDto[];
}

// Get list of users for search method.
export class GetListOfUsersForSearchResponseDto {
    @ApiProperty({
        description: 'Current page number',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'Items per page',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'Total number of users',
        example: 50,
    })
    total: number;

    @ApiProperty({
        description: 'List of users',
        type: [UserResponseForSearchResponseDto],
    })
    users: UserResponseForSearchResponseDto[];
}
