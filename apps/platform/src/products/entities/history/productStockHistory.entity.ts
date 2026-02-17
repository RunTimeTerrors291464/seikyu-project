import { Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';

// Import entities.
import { ProductsEntity } from '../products.entity';

// Import enums.
import { InvoiceType } from '@app/common/enums/invoiceType.enum';
import { StockActionType } from '@app/common/enums/stockActionType.enum';


@Entity('product_stock_history')
export class ProductStockHistoryEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ProductsEntity, (product) => product.productsHistory)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;

    @Column({ name: 'quantity_type', type: 'enum', enum: StockActionType })
    quantityType: StockActionType;

    @Column({ name: 'quantity', type: 'integer' })
    quantity: number;

    @Column({ name: 'reference_type', type: 'enum', enum: InvoiceType })
    referenceType: InvoiceType;

    @Column({ name: 'reference_id', type: 'uuid' })
    referenceId: string;

    @Column({ name: 'before_inventory_stock', type: 'integer' })
    beforeInventoryStock: number;

    @Column({ name: 'after_inventory_stock', type: 'integer' })
    afterInventoryStock: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}