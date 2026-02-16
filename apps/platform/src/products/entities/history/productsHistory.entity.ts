import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

// Import entities.
import { ProductsEntity } from '../products.entity';

// Import snapshots.
import { ProductSnapshotDto } from '@app/common/dtos/platform/products/history/productSnapshot.dto';

@Entity('products_history')
export class ProductsHistoryEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ProductsEntity, (product) => product.productsHistory)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: ProductsEntity;

    @Column({ name: 'version', type: 'integer' })
    version: number;

    @Column({ name: 'created_by', type: 'uuid' })
    createdBy: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @Column({ name: 'data', type: 'jsonb' })
    data: ProductSnapshotDto;
}