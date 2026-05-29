import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Import swagger.
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
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
        description: 'Password for login',
        example: 'SecurePassword123!',
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(64, { message: 'password must be less than 64 characters.' })
    password: string;
}

export class LogoutRequestDto {
    @ApiProperty({
        description: 'The valid refresh token',
        example: 'Refresh token',
        maxLength: 4096,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(4096, { message: 'refreshToken must be less than 4096 characters.' })
    refreshToken: string;
} 

export class GetAccessTokenRequestDto {
    @ApiProperty({
        description: 'The valid refresh token',
        example: 'Refresh token',
        maxLength: 4096,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(4096, { message: 'refreshToken must be less than 4096 characters.' })
    refreshToken: string;
}
