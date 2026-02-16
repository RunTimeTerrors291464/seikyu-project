import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { StockAdjustmentProductsEntity } from './stockAdjustmentProducts.entity';

// Import enums.
import { StockAdjustmentStatus } from '@app/common/enums/invoiceStatus.enum';
import { StockAdjustmentType } from '@app/common/enums/stockAdjustmentType.enum';

@Entity('stock_adjustment')
export class StockAdjustmentEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'adjustment_id', type: 'varchar', length: 15, nullable: true })
    adjustmentId: string | null;

    @Column({ name: 'stock_adjustment_type', type: 'enum', enum: StockAdjustmentType })
    stockAdjustmentType: StockAdjustmentType;

    @Column({ name: 'reference_id', type: 'uuid', nullable: true })
    referenceId: string | null;

    @OneToMany(() => StockAdjustmentProductsEntity, (product) => product.stockAdjustment)
    stockAdjustmentProducts: StockAdjustmentProductsEntity[];

    @Column({ name: 'total_products', type: 'integer' })
    totalProducts: number;

    @Column({ name: 'total_increase', type: 'integer' })
    totalIncrease: number;

    @Column({ name: 'total_decrease', type: 'integer' })
    totalDecrease: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'status', type: 'integer', enum: StockAdjustmentStatus, default: StockAdjustmentStatus.DRAFT })
    status: StockAdjustmentStatus;

    @Column({ name: 'draft_by', type: 'uuid', nullable: true })
    draftBy: string | null;

    @Column({ name: 'draft_at', type: 'timestamp', nullable: true })
    draftAt: Date | null;

    @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
    confirmedBy: string | null;

    @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
    confirmedAt: Date | null;
}
