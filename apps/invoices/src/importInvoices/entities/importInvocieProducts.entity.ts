import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { ImportInvoiceEntity } from './importInvoices.entity';

@Entity('import_invoice_products')
export class ImportInvoiceProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ImportInvoiceEntity, (importInvoice) => importInvoice.importInvoiceProducts)
    @JoinColumn({ name: 'import_invoice_id', referencedColumnName: 'id' })
    importInvoice: ImportInvoiceEntity;

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

    @Column({ name: 'import_price', type: 'decimal', precision: 10, scale: 2 })
    importPrice: number;

    @Column({ name: 'total_import_price', type: 'decimal', precision: 10, scale: 2 })
    totalImportPrice: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

}

