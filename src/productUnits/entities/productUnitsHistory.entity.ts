import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToOne } from 'typeorm';

// Import entities.
import { ProductUnitsEntity } from './productUnits.entity';
import { UsersEntity } from '@src/users/entities/users.entity';

// Import DTOs.
import { ProductUnitSnapshotDto, ProductUnitChangeEventDto } from '@libs/common/dtos/productUnits/productUnitSnapshot.dto';

@Entity('product_units_history')
export class ProductUnitsHistoryEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_unit_id', type: 'uuid' })
    productUnitId: string;

    @Column({ name: 'version', type: 'integer' })
    version: number;

    @Column({ name: 'created_by', type: 'uuid' })
    createdBy: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @Column({ name: 'events', type: 'jsonb', array: false })
    events: ProductUnitChangeEventDto[];

    @Column({ name: 'events_summary', type: 'varchar', array: true, comment: 'Quick-access list of changed field names for audit display' })
    eventSummary: string[];

    @Column({ name: 'is_snapshot', type: 'boolean', default: false, comment: 'Indicates if this version contains a full snapshot (every N versions)' })
    isSnapshot: boolean;

    @Column({ name: 'data', type: 'jsonb', nullable: true, comment: 'Full product unit snapshot' })
    data: ProductUnitSnapshotDto | null;

    // --- Relationships ---
    @ManyToOne(() => ProductUnitsEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_unit_id', referencedColumnName: 'id' })
    productUnit: ProductUnitsEntity;

    @OneToOne(() => UsersEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
    createdByUser: UsersEntity;
}