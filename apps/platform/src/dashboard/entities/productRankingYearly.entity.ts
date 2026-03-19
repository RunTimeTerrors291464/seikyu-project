import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Import entities.
import { ProductsEntity } from '../../products/entities/products.entity';

// Import enum.
import { InvoiceType } from '@app/common/enums/invoiceType.enum';

@Entity('product_ranking_yearly')
export class ProductRankingYearlyEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ProductsEntity, (product) => product.yearlyRankings)
    @JoinColumn({ name: 'product_id' })
    product: ProductsEntity;

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
}
