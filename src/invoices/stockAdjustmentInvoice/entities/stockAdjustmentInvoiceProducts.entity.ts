import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Import enums.
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { StockAdjustmentReason } from '@libs/common/enums/returnReasons.enum';

// Import entities.
import { StockAdjustmentInvoiceEntity } from './stockAdjustmentInvoices.entity';
import { ProductsEntity } from '@src/products/entities/products.entity';

@Entity('stock_adjustment_invoice_products')
export class StockAdjustmentInvoiceProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'stock_adjustment_invoice_id', type: 'uuid' }) // FK: stock_adjustment_invoices.id
    stockAdjustmentInvoiceId: string;

    @Column({ name: 'product_id', type: 'uuid' }) // FK: products.id
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

    @Column({ name: 'reason_category', type: 'varchar', enum: StockAdjustmentReason, default: StockAdjustmentReason.OTHER })
    reasonCategory: StockAdjustmentReason;

    @Column({ name: 'reason_notes', type: 'text', nullable: true })
    reasonNotes: string | null;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

    // --- Relationships ---
    @ManyToOne(() => StockAdjustmentInvoiceEntity, (stockAdjustmentInvoice) => stockAdjustmentInvoice.stockAdjustmentInvoiceProducts)
    @JoinColumn({ name: 'stock_adjustment_invoice_id', referencedColumnName: 'id' })
    stockAdjustmentInvoice: StockAdjustmentInvoiceEntity;

    @ManyToOne(() => ProductsEntity)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;

}
