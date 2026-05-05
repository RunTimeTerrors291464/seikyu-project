import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

// Import entities.
import { ProductsEntity } from '@src/products/entities/products.entity';

// Import enums.
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';

@Entity('product_ranking_yearly')
@Unique(['productId', 'invoiceType', 'year'])
export class ProductRankingYearlyEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id', type: 'uuid' }) // FK: products.id
    productId: string;

    @Column({ name: 'quantity', type: 'integer' })
    quantity: number;

    @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;

    @Column({ name: 'invoice_type', type: 'varchar', length: 20, enum: InvoiceType })
    invoiceType: InvoiceType;

    @Column({ name: 'year', type: 'integer' })
    year: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    // --- Relationships ---
    @ManyToOne(() => ProductsEntity, (product) => product.yearlyRankings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;
}
