import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

// Import entities.
import { ProductUnitsEntity } from '../productUnits.entity';

// Import snapshots.
import { ProductUnitSnapshotDto } from '@app/common/dtos/platform/products/history/productUnitSnapshot.dto';

@Entity('product_units_history')
export class ProductUnitsHistoryEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ProductUnitsEntity, (productUnit) => productUnit.productUnitsHistory)
    @JoinColumn({ name: 'product_unit_id', referencedColumnName: 'id' })
    productUnit: ProductUnitsEntity;

    @Column({ name: 'version', type: 'integer' })
    version: number;

    @Column({ name: 'created_by', type: 'uuid' })
    createdBy: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @Column({ name: 'data', type: 'jsonb' })
    data: ProductUnitSnapshotDto;
}