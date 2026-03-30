import { IsNotEmpty, IsString } from 'class-validator';

// Import swagger.
import { ApiProperty } from '@nestjs/swagger';

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

export class GetAccessTokenRequestDto {
    @ApiProperty({
        description: 'The valid refresh token',
        example: 'Refresh token',
    })
    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}