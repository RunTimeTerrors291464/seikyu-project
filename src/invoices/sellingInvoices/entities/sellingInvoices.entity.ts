import { Entity, Column, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

// Import entities.
import { SellingInvoiceProductsEntity } from './sellingInvoiceProducts.entity';
import { ReturnSellingInvoiceEntity } from './returnSellingInvoices.entity';
import { UsersEntity } from '@src/users/entities/users.entity';

// Import enums.
import { SellingInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

@Entity('selling_invoice')
export class SellingInvoiceEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'invoice_id', type: 'varchar', length: 15, nullable: true })
    invoiceId: string | null;

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

    @Column({ name: 'return_count', type: 'integer', default: 0 })
    returnCount: number;

    @Column({ name: 'tax_focus', type: 'boolean' })
    taxFocus: boolean;

    @Column({ name: 'confirmed_by', type: 'uuid', nullable: true }) // FK: users.id
    confirmedBy: string | null;

    @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
    confirmedAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    // --- Relationships ---
    @OneToMany(() => SellingInvoiceProductsEntity, (sellingInvoiceProduct) => sellingInvoiceProduct.sellingInvoice)
    sellingInvoiceProducts: SellingInvoiceProductsEntity[];

    @OneToMany(() => ReturnSellingInvoiceEntity, (returnSellingInvoice) => returnSellingInvoice.sellingInvoice)
    returnSellingInvoices: ReturnSellingInvoiceEntity[];

    @ManyToOne(() => UsersEntity)
    @JoinColumn({ name: 'confirmed_by', referencedColumnName: 'id' })
    confirmedByUser: UsersEntity;

}
