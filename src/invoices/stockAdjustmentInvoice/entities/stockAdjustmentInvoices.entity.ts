import { Entity, Column, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

// Import entities.
import { StockAdjustmentInvoiceProductsEntity } from './stockAdjustmentInvoiceProducts.entity';
import { UsersEntity } from '@src/users/entities/users.entity';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

@Entity('stock_adjustment_invoice')
export class StockAdjustmentInvoiceEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'invoice_id', type: 'varchar', length: 15, nullable: true })
    invoiceId: string | null;

    @Column({ name: 'total_products', type: 'integer' })
    totalProducts: number;

    @Column({ name: 'total_quantity', type: 'integer' })
    totalQuantity: number;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'status', type: 'varchar', enum: StockAdjustmentInvoiceStatus, default: StockAdjustmentInvoiceStatus.DRAFT })
    status: StockAdjustmentInvoiceStatus;

    @Column({ name: 'draft_by', type: 'uuid', nullable: true }) // FK: users.id
    draftBy: string | null;

    @Column({ name: 'draft_at', type: 'timestamp', nullable: true })
    draftAt: Date | null;

    @Column({ name: 'confirmed_by', type: 'uuid', nullable: true }) // FK: users.id
    confirmedBy: string | null;

    @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
    confirmedAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    // --- Relationships ---
    @OneToMany(() => StockAdjustmentInvoiceProductsEntity, (stockAdjustmentInvoiceProduct) => stockAdjustmentInvoiceProduct.stockAdjustmentInvoice)
    stockAdjustmentInvoiceProducts: StockAdjustmentInvoiceProductsEntity[];

    @ManyToOne(() => UsersEntity)
    @JoinColumn({ name: 'draft_by', referencedColumnName: 'id' })
    draftByUser: UsersEntity;

    @ManyToOne(() => UsersEntity)
    @JoinColumn({ name: 'confirmed_by', referencedColumnName: 'id' })
    confirmedByUser: UsersEntity;

}
