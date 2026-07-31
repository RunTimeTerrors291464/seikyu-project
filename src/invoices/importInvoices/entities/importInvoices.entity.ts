import { Entity, Column, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

// Import entities.
import { ImportInvoiceProductsEntity } from './importInvocieProducts.entity';
import { ReturnImportInvoiceEntity } from './returnImportInvoices.entity';
import { UsersEntity } from '@src/users/entities/users.entity';

// Import enums.
import { ImportInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

@Entity('import_invoice')
export class ImportInvoiceEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'invoice_id', type: 'varchar', length: 15, nullable: true })
    invoiceId: string | null;

    @Column({ name: 'total_products', type: 'integer' })
    totalProducts: number;

    @Column({ name: 'total_quantity', type: 'integer' })
    totalQuantity: number;

    @Column({ name: 'total_import_price', type: 'decimal', precision: 10, scale: 2 })
    totalImportPrice: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'status', type: 'varchar', enum: ImportInvoiceStatus, default: ImportInvoiceStatus.DRAFT })
    status: ImportInvoiceStatus;

    @Column({ name: 'return_count', type: 'integer', default: 0 })
    returnCount: number;

    @Column({ name: 'draft_by', type: 'uuid', nullable: true })
    draftBy: string | null;

    @Column({ name: 'draft_at', type: 'timestamp', nullable: true })
    draftAt: Date | null;

    @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
    confirmedBy: string | null;

    @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
    confirmedAt: Date | null;

    // Soft delete flag. Deleted invoices are hidden from every read path and cannot be restored.
    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    // --- Relationships ---
    @OneToMany(() => ImportInvoiceProductsEntity, (importInvoiceProduct) => importInvoiceProduct.importInvoice)
    importInvoiceProducts: ImportInvoiceProductsEntity[];

    @OneToMany(() => ReturnImportInvoiceEntity, (returnImportInvoice) => returnImportInvoice.importInvoice)
    returnImportInvoices: ReturnImportInvoiceEntity[];

    @ManyToOne(() => UsersEntity)
    @JoinColumn({ name: 'draft_by', referencedColumnName: 'id' })
    draftByUser: UsersEntity;

    @ManyToOne(() => UsersEntity)
    @JoinColumn({ name: 'confirmed_by', referencedColumnName: 'id' })
    confirmedByUser: UsersEntity;
}