import { Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';

// Import entities.
import { ProductsEntity } from './products.entity';

// Import enums.
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';


@Entity('product_stock_history')
export class ProductStockHistoryEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id', type: 'uuid' }) // FK: products.id
    productId: string;

    @Column({ name: 'quantity_type', type: 'enum', enum: StockActionType })
    quantityType: StockActionType;

    @Column({ name: 'quantity', type: 'integer' })
    quantity: number;

    @Column({ name: 'invoice_type', type: 'enum', enum: InvoiceType })
    invoiceType: InvoiceType;

    @Column({ name: 'invoice_id', type: 'uuid' })
    invoiceId: string;

    @Column({ name: 'before_inventory_stock', type: 'integer' })
    beforeInventoryStock: number;

    @Column({ name: 'after_inventory_stock', type: 'integer' })
    afterInventoryStock: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    // --- Relationships ---
    @ManyToOne(() => ProductsEntity, (product) => product.productStockHistory)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;

}