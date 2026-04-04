import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { ReturnSellingInvoiceEntity } from './returnSellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '../../sellingInvoices/entities/sellingInvoiceProducts.entity';
import { ProductsEntity } from '@src/products/entities/products.entity';

// Import enums.
import { ReturnReason } from '@libs/common/enums/returnReasons.enum';

@Entity('return_selling_invoice_products')
export class ReturnSellingInvoiceProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'return_selling_invoice_id', type: 'uuid' }) // FK: return_selling_invoices.id
    returnSellingInvoiceId: string;

    @Column({ name: 'product_id', type: 'uuid' }) // FK: products.id
    productId: string;

    @Column({ name: 'product_sku', type: 'varchar', length: 255 })
    productSku: string;

    @Column({ name: 'product_name', type: 'varchar', length: 255 })
    productName: string;

    @Column({ name: 'product_unit', type: 'varchar', length: 255 })
    productUnit: string;

    @Column({ name: 'return_quantity', type: 'integer' })
    returnQuantity: number;

    @Column({ name: 'selling_price', type: 'decimal', precision: 10, scale: 2 })
    sellingPrice: number;

    @Column({ name: 'total_return_price', type: 'decimal', precision: 10, scale: 2 })
    totalReturnPrice: number;

    @Column({ name: 'reason_category', type: 'varchar', enum: ReturnReason, default: ReturnReason.OTHER })
    reasonCategory: ReturnReason;

    @Column({ name: 'reason_notes', type: 'text', nullable: true })
    reasonNotes: string | null;

    // --- Relationships ---
    @ManyToOne(() => ReturnSellingInvoiceEntity, (returnSellingInvoice) => returnSellingInvoice.returnSellingInvoiceProducts)
    @JoinColumn({ name: 'return_selling_invoice_id', referencedColumnName: 'id' })
    returnSellingInvoice: ReturnSellingInvoiceEntity;

    @ManyToOne(() => SellingInvoiceProductsEntity)
    @JoinColumn({ name: 'selling_invoice_product_id', referencedColumnName: 'id' })
    sellingInvoiceProduct: SellingInvoiceProductsEntity;

    @ManyToOne(() => ProductsEntity)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;

}
