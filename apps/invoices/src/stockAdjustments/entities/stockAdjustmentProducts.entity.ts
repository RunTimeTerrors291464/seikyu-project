import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { StockAdjustmentEntity } from './stockAdjustment.entity';

// Import enums.
import { StockActionType } from '@app/common/enums/stockActionType.enum';

@Entity('stock_adjustment_products')
export class StockAdjustmentProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => StockAdjustmentEntity, (stockAdjustment) => stockAdjustment.stockAdjustmentProducts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'stock_adjustment_id', referencedColumnName: 'id' })
    stockAdjustment: StockAdjustmentEntity;

    @Column({ name: 'product_id', type: 'uuid' })
    productId: string;

    @Column({ name: 'product_sku', type: 'varchar', length: 255 })
    productSku: string;

    @Column({ name: 'product_name', type: 'varchar', length: 255 })
    productName: string;

    @Column({ name: 'product_unit', type: 'varchar', length: 255 })
    productUnit: string;

    @Column({ name: 'quantity', type: 'integer' })
    quantity: number;

    @Column({ name: 'type', type: 'enum', enum: StockActionType })
    type: StockActionType;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

}
