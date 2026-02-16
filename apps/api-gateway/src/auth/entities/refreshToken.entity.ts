import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokenEntity {

    @PrimaryColumn('uuid') 
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'refresh_token', type: 'text' })
    refreshToken: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;
}