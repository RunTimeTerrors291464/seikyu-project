import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { ReturnImportInvoiceEntity } from './returnImportInvoices.entity';
import { ImportInvoiceProductsEntity } from '../../importInvoices/entities/importInvocieProducts.entity';

@Entity('return_import_invoice_products')
export class ReturnImportInvoiceProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ReturnImportInvoiceEntity, (returnImportInvoice) => returnImportInvoice.returnImportInvoiceProducts)
    @JoinColumn({ name: 'return_import_invoice_id', referencedColumnName: 'id' })
    returnImportInvoice: ReturnImportInvoiceEntity;

    @ManyToOne(() => ImportInvoiceProductsEntity)
    @JoinColumn({ name: 'import_invoice_product_id', referencedColumnName: 'id' })
    importInvoiceProduct: ImportInvoiceProductsEntity;

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

    @Column({ name: 'import_price', type: 'decimal', precision: 10, scale: 2 })
    importPrice: number;

    @Column({ name: 'total_return_price', type: 'decimal', precision: 10, scale: 2 })
    totalReturnPrice: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

}
