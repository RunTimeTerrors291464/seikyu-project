import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { ReturnSellingInvoiceEntity } from './returnSellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '../../sellingInvoices/entities/sellingInvoiceProducts.entity';

@Entity('return_selling_invoice_products')
export class ReturnSellingInvoiceProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ReturnSellingInvoiceEntity, (returnSellingInvoice) => returnSellingInvoice.returnSellingInvoiceProducts)
    @JoinColumn({ name: 'return_selling_invoice_id', referencedColumnName: 'id' })
    returnSellingInvoice: ReturnSellingInvoiceEntity;

    @ManyToOne(() => SellingInvoiceProductsEntity)
    @JoinColumn({ name: 'selling_invoice_product_id', referencedColumnName: 'id' })
    sellingInvoiceProduct: SellingInvoiceProductsEntity;

    @Column({ name: 'product_id', type: 'uuid' })
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

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

}
