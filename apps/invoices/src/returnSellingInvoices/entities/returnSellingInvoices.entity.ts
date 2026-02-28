import { Entity, Column, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// Import entities.
import { ReturnSellingInvoiceProductsEntity } from '../entities/returnSellingInvoiceProducts.entity';
import { SellingInvoiceEntity } from '../../sellingInvoices/entities/sellingInvoices.entity';

// Import enums.
import { ReturnSellingInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Entity('return_selling_invoice')
export class ReturnSellingInvoiceEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'return_invoice_id', type: 'varchar', length: 15, nullable: true })
    returnInvoiceId: string | null;

    @ManyToOne(() => SellingInvoiceEntity, (sellingInvoice) => sellingInvoice.returnSellingInvoices)
    @JoinColumn({ name: 'selling_invoice_id', referencedColumnName: 'id' })
    sellingInvoice: SellingInvoiceEntity;

    @OneToMany(() => ReturnSellingInvoiceProductsEntity, (returnSellingInvoiceProduct) => returnSellingInvoiceProduct.returnSellingInvoice)
    returnSellingInvoiceProducts: ReturnSellingInvoiceProductsEntity[];

    @Column({ name: 'total_products', type: 'integer' })
    totalProducts: number;

    @Column({ name: 'total_quantity', type: 'integer' })
    totalQuantity: number;

    @Column({ name: 'total_return_price', type: 'decimal', precision: 10, scale: 2 })
    totalReturnPrice: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'status', type: 'varchar', enum: ReturnSellingInvoiceStatus, default: ReturnSellingInvoiceStatus.DRAFT })
    status: ReturnSellingInvoiceStatus;

    @Column({ name: 'draft_by', type: 'uuid', nullable: true })
    draftBy: string | null;

    @Column({ name: 'draft_at', type: 'timestamp', nullable: true })
    draftAt: Date | null;

    @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
    confirmedBy: string | null;

    @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
    confirmedAt: Date | null;

}
