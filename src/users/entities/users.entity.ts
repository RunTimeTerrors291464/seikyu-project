// Imports typeORM.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

@Entity('users')
export class UsersEntity {

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

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    // --- User roles ---
    @Column({ name: 'is_admin', type: 'boolean', default: false })
    isAdmin: boolean;

    @Column({ name: 'is_manager', type: 'boolean', default: false })
    isManager: boolean;

    @Column({ name: 'is_cashier', type: 'boolean', default: false })
    isCashier: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @VersionColumn({ name: 'version', type: 'int', default: 1 })
    version: number;

}
