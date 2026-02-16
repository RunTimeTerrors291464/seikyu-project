import { Role } from '@app/common/enums/role.enum';

export interface AccessTokenPayload {
    id: string;
    username: string;
    roles: Role[];
    refreshTokenId: string;
}

export interface RefreshTokenPayload {
    id: string;
    userId: string;
}