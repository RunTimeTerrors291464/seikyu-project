import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

// Import entities.
import { UsersEntity } from '@src/users/entities/users.entity';

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

    // --- Relationships ---
    @ManyToOne(() => UsersEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user?: UsersEntity;
}
