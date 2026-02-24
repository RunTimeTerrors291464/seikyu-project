import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { SellingInvoiceEntity } from './sellingInvoices.entity';

@Entity('selling_invoice_products')
export class SellingInvoiceProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => SellingInvoiceEntity, (sellingInvoice) => sellingInvoice.sellingInvoiceProducts)
    @JoinColumn({ name: 'selling_invoice_id', referencedColumnName: 'id' })
    sellingInvoice: SellingInvoiceEntity;

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

    @Column({ name: 'selling_price', type: 'decimal', precision: 10, scale: 2 })
    sellingPrice: number;

    @Column({ name: 'product_discount', type: 'decimal', precision: 10, scale: 2, default: 0 })
    productDiscount: number;

    @Column({ name: 'total_selling_price', type: 'decimal', precision: 10, scale: 2 })
    totalSellingPrice: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

}
