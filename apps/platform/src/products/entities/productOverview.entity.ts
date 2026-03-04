import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('product_overview')
export class ProductOverviewEntity {

    @PrimaryColumn({ name: 'id', type: 'uuid', default: '00000000-0000-0000-0000-000000000001' })
    id: string = '00000000-0000-0000-0000-000000000001';

    @Column({ name: 'total_products', type: 'integer', default: 0 })
    totalProducts: number;

    @Column({ name: 'in_stock', type: 'integer', default: 0 })
    inStock: number;

    @Column({ name: 'low_stock', type: 'integer', default: 0 })
    lowStock: number;

    @Column({ name: 'out_of_stock', type: 'integer', default: 0 })
    outOfStock: number;

    @Column({ name: 'inventory_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
    inventoryValue: number;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}