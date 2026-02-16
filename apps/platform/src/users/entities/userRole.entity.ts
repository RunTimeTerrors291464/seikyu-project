// Imports typeORM.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

// Imports role enum.
import { Role } from '@app/common/enums/role.enum';

// Imports user entity.
import { UserEntity } from './user.entity';

@Entity('user_roles')
export class UserRoleEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => UserEntity, (user) => user.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
    user: UserEntity;

    @Column({ name: 'role', type: 'enum', enum: Role })
    role: Role;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}