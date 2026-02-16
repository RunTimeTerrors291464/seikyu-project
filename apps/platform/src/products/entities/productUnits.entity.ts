import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany, VersionColumn } from 'typeorm';

// Import entities.
import { ProductsEntity } from './products.entity';
import { ProductUnitsHistoryEntity } from './history/productUnitsHistory.entity';

@Entity('product_units')
export class ProductUnitsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'unit_name', type: 'varchar', length: 255 })
    unitName: string;

    @OneToMany(() => ProductsEntity, (product) => product.productUnit)
    products: ProductsEntity[];

    @Column({ name: 'unit_description', type: 'text', nullable: true })
    unitDescription?: string;

    @Column({ name: 'active', type: 'boolean', default: true })
    active: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @OneToMany(() => ProductUnitsHistoryEntity, (productUnitsHistory) => productUnitsHistory.productUnit, { onDelete: 'CASCADE' })
    productUnitsHistory: ProductUnitsHistoryEntity[];

}