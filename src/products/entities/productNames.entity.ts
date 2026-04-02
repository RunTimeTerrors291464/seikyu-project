import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';

// Import entities.
import { ProductsEntity } from './products.entity';

@Entity('product_names')
export class ProductNamesEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id', type: 'uuid' }) // FK: products.id
    productId: string;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'is_main', type: 'boolean', default: false })
    isMain: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    // --- Relationships ---
    @ManyToOne(() => ProductsEntity, (product) => product.productNames)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;

}