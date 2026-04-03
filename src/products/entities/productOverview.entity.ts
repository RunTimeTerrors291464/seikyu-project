import { Entity, Column, PrimaryColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

@Entity('product_overview')
export class ProductOverviewEntity {

    @PrimaryColumn({ name: 'id', type: 'uuid', default: '00000000-0000-0000-0000-000000000001' })
    id: string = '00000000-0000-0000-0000-000000000001';

    @Column({ name: 'total_products', type: 'integer', default: 0 })
    totalProducts: number = 0;

    @Column({ name: 'in_stock', type: 'integer', default: 0 })
    inStock: number = 0;

    @Column({ name: 'low_stock', type: 'integer', default: 0 })
    lowStock: number = 0;

    @Column({ name: 'out_of_stock', type: 'integer', default: 0 })
    outOfStock: number = 0;

    @Column({ name: 'inventory_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
    inventoryValue: number = 0;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}   