// Import enums.
import { Role } from '@libs/common/enums/role.enum';

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