import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToOne } from 'typeorm';

// Import entities.
import { ProductsEntity } from './products.entity';
import { UsersEntity } from '@src/users/entities/users.entity';

// Import DTOs.
import { ProductSnapshotDto } from '@libs/common/dtos/products/productSnapshot.dto';
import { ProductChangeEventDto } from '@libs/common/dtos/products/productSnapshot.dto';

@Entity('products_history')
export class ProductsHistoryEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id', type: 'uuid' }) // FK: products.id
    productId: string;

    @Column({ name: 'version', type: 'integer' })
    version: number;

    @Column({ name: 'created_by', type: 'uuid' }) // FK: users.id
    createdBy: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @Column({ name: 'events', type: 'jsonb', array: false })
    events: ProductChangeEventDto[];

    @Column({ name: 'events_summary', type: 'varchar', array: true, comment: 'Quick-access list of changed field names for audit display' })
    eventSummary: string[];

    @Column({ name: 'is_snapshot', type: 'boolean', default: false, comment: 'Indicates if this version contains a full snapshot (every N versions)' })
    isSnapshot: boolean;

    @Column({ name: 'data', type: 'jsonb', nullable: true, comment: 'Full product snapshot' })
    data: ProductSnapshotDto | null;

    // --- Relationships ---
    @ManyToOne(() => ProductsEntity, (product) => product.productsHistory)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;

    @OneToOne(() => UsersEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
    createdByUser: UsersEntity;

}