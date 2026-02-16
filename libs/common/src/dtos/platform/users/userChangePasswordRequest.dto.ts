import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

    @ApiProperty({
        description: 'Confirm new password',
        example: 'NewPassword123!',
        minLength: 8,
        maxLength: 64,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'confirmPassword must be at least 8 characters.' })
    @MaxLength(64, { message: 'confirmPassword must be less than 64 characters.' })
    confirmPassword: string;
}
