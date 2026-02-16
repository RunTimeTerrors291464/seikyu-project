import { ApiProperty } from '@nestjs/swagger';

// Import DTOs.
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

export class AccessTokenResponseDto {
    @ApiProperty({
        description: 'The valid access token',
        example: 'Access token',
    })
    accessToken: string;
}

export class AuthResponseDto {
    @ApiProperty({
        description: 'Access token, valid for 10 minutes',
        example: 'JWT token format.',
    })
    accessToken: string;

    @ApiProperty({
        description: 'Refresh token, valid for 14 days',
        example: 'JWT token format.',
    })
    refreshToken: string;

    @ApiProperty({
        description: 'User`s information after login',
        type: UserResponseDto,
    })
    user: UserResponseDto;
}
