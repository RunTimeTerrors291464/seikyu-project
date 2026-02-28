import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Import enums.
import { StockActionType } from '@app/common/enums/stockActionType.enum';

// Import entities.
import { StockAdjustmentInvoiceEntity } from './stockAdjustmentInvoices.entity';

@Entity('stock_adjustment_invoice_products')
export class StockAdjustmentInvoiceProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => StockAdjustmentInvoiceEntity, (stockAdjustmentInvoice) => stockAdjustmentInvoice.stockAdjustmentInvoiceProducts)
    @JoinColumn({ name: 'stock_adjustment_invoice_id', referencedColumnName: 'id' })
    stockAdjustmentInvoice: StockAdjustmentInvoiceEntity;

    @Column({ name: 'product_id', type: 'uuid' })
    productId: string;

    @Column({ name: 'product_sku', type: 'varchar', length: 255 })
    productSku: string;

    @Column({ name: 'product_name', type: 'varchar', length: 255 })
    productName: string;

    @Column({ name: 'product_unit', type: 'varchar', length: 255 })
    productUnit: string;

    @Column({ name: 'action', type: 'varchar', enum: StockActionType })
    action: StockActionType;

    @Column({ name: 'quantity', type: 'integer' })
    quantity: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

}
