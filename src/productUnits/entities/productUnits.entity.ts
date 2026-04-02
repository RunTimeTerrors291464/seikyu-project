import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany, VersionColumn } from 'typeorm';

// Import entities.
import { ProductsEntity } from '@src/products/entities/products.entity';

@Entity('product_units')
export class ProductUnitsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'unit_name', type: 'varchar', length: 255 })
    unitName: string;

    @Column({ name: 'unit_description', type: 'text', nullable: true })
    unitDescription?: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    // --- Relationships ---
    @OneToMany(() => ProductsEntity, (product) => product.productUnit)
    products: ProductsEntity[];
}