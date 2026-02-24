import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { SellingInvoiceProductsEntity } from './sellingInvoiceProducts.entity';

// Import enums.
import { SellingInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Entity('selling_invoice')
export class SellingInvoiceEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'invoice_id', type: 'varchar', length: 15, nullable: true })
    invoiceId: string | null;

    @OneToMany(() => SellingInvoiceProductsEntity, (sellingInvoiceProduct) => sellingInvoiceProduct.sellingInvoice)
    sellingInvoiceProducts: SellingInvoiceProductsEntity[];

    @Column({ name: 'total_products', type: 'integer' })
    totalProducts: number;

    @Column({ name: 'total_quantity', type: 'integer' })
    totalQuantity: number;

    @Column({ name: 'invoice_discount', type: 'decimal', precision: 10, scale: 2, default: 0 })
    invoiceDiscount: number;

    @Column({ name: 'total_selling_price', type: 'decimal', precision: 10, scale: 2 })
    totalSellingPrice: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'status', type: 'varchar', enum: SellingInvoiceStatus, default: SellingInvoiceStatus.CONFIRMED })
    status: SellingInvoiceStatus;

    @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
    confirmedBy: string | null;

    @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
    confirmedAt: Date | null;

}
