import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Import interfaces.
import type { AccessTokenPayload } from './jwtPayload.interface';

export class AccessTokenRequestDto {
    @ApiProperty({
        description: 'The valid refresh token',
        example: 'Refresh token',
    })
    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}

export class LoginRequestDto {
    @ApiProperty({
        description: 'Username for login',
        example: 'johndoe',
    })
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({
        description: 'Password for login',
        example: 'SecurePassword123!',
    })
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class LogoutRequestDto {
    @ApiProperty({
        description: 'The valid refresh token',
        example: 'Refresh token',
    })
    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}