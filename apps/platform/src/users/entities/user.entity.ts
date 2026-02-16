// Imports typeORM.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

// Imports user role entity.
import { UserRoleEntity } from './userRole.entity';

@Entity('users')
export class UserEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'first_name', type: 'varchar', length: 64 })
    firstName: string;

    @Column({ name: 'middle_name', type: 'varchar', length: 64, nullable: true })
    middleName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 64, nullable: true })
    lastName: string;

    @Column({ name: 'search_vector_name', type: 'tsvector', nullable: true, select: false })
    searchVectorName: string;

    @Column({ name: 'username', type: 'varchar', length: 64 })
    username: string;

    @Column({ name: 'password', type: 'varchar', length: 255 })
    password: string;

    @OneToMany(() => UserRoleEntity, (userRole) => userRole.user, { onDelete: 'CASCADE' })
    userRoles: UserRoleEntity[];

    @Column({ name: 'active', type: 'boolean', default: true })
    active: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}