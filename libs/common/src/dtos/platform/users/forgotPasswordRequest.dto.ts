import { IsNotEmpty, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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