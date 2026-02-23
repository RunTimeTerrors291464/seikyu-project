import { Entity, Column, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { ReturnImportInvoiceProductsEntity } from '../entities/returnImportInvoiceProducts.entity';
import { ImportInvoiceEntity } from '../../importInvoices/entities/importInvoices.entity';

// Import enums.
import { ReturnImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Entity('return_import_invoice')
export class ReturnImportInvoiceEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'return_invoice_id', type: 'varchar', length: 15, nullable: true })
    returnInvoiceId: string | null;

    @ManyToOne(() => ImportInvoiceEntity, (importInvoice) => importInvoice.returnImportInvoices)
    @JoinColumn({ name: 'import_invoice_id', referencedColumnName: 'id' })
    importInvoice: ImportInvoiceEntity;

    @OneToMany(() => ReturnImportInvoiceProductsEntity, (returnImportInvoiceProduct) => returnImportInvoiceProduct.returnImportInvoice)
    returnImportInvoiceProducts: ReturnImportInvoiceProductsEntity[];

    @Column({ name: 'total_products', type: 'integer' })
    totalProducts: number;

    @Column({ name: 'total_quantity', type: 'integer' })
    totalQuantity: number;

    @Column({ name: 'total_return_price', type: 'decimal', precision: 10, scale: 2 })
    totalReturnPrice: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'status', type: 'varchar', enum: ReturnImportInvoiceStatus, default: ReturnImportInvoiceStatus.DRAFT })
    status: ReturnImportInvoiceStatus;

    @Column({ name: 'draft_by', type: 'uuid', nullable: true })
    draftBy: string | null;

    @Column({ name: 'draft_at', type: 'timestamp', nullable: true })
    draftAt: Date | null;

    @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
    confirmedBy: string | null;

    @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
    confirmedAt: Date | null;

}
