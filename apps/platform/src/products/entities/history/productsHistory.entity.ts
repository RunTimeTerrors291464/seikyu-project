import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

// Import entities.
import { ProductsEntity } from '../products.entity';

// Import DTOs.
import { ProductSnapshotDto } from '@app/common/dtos/platform/products/history/snapshot/productSnapshot.dto';
import { ProductChangeEventDto } from '@app/common/dtos/platform/products/history/snapshot/productSnapshot.dto';

@Entity('products_history')
export class ProductsHistoryEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ProductsEntity, (product) => product.productsHistory)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;

    @Column({ name: 'version', type: 'integer' })
    version: number;

    @Column({ name: 'created_by', type: 'uuid' })
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

}