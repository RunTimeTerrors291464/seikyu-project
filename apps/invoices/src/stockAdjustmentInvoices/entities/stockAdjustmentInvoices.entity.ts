import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { StockAdjustmentInvoiceProductsEntity } from './stockAdjustmentInvoiceProducts.entity';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';
import { StockActionReason } from '@app/common/enums/stockActionType.enum';

@Entity('stock_adjustment_invoice')
export class StockAdjustmentInvoiceEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'invoice_id', type: 'varchar', length: 15, nullable: true })
    invoiceId: string | null;

    @OneToMany(() => StockAdjustmentInvoiceProductsEntity, (stockAdjustmentInvoiceProduct) => stockAdjustmentInvoiceProduct.stockAdjustmentInvoice)
    stockAdjustmentInvoiceProducts: StockAdjustmentInvoiceProductsEntity[];

    @Column({ name: 'total_products', type: 'integer' })
    totalProducts: number;

    @Column({ name: 'total_quantity', type: 'integer' })
    totalQuantity: number;

    @Column({ name: 'action_reason', type: 'varchar', enum: StockActionReason })
    actionReason: StockActionReason;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'status', type: 'varchar', enum: StockAdjustmentInvoiceStatus, default: StockAdjustmentInvoiceStatus.DRAFT })
    status: StockAdjustmentInvoiceStatus;

    @Column({ name: 'draft_by', type: 'uuid', nullable: true })
    draftBy: string | null;

    @Column({ name: 'draft_at', type: 'timestamp', nullable: true })
    draftAt: Date | null;

    @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
    confirmedBy: string | null;

    @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
    confirmedAt: Date | null;

}
