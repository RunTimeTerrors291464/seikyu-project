import { Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Import enum
import { StockStatus } from '@libs/common/enums/stockStatus.enum';

// Import entities.
import { ProductNamesEntity } from './productNames.entity';
import { ProductUnitsEntity } from '@src/productUnits/entities/productUnits.entity';
import { ProductStockHistoryEntity } from './productStockHistory.entity';
import { ProductsHistoryEntity } from './productsHistory.entity';
import { ProductRankingDailyEntity } from '@src/dashboard/entities/productRankingDaily.entity';
import { ProductRankingMonthlyEntity } from '@src/dashboard/entities/productRankingMonthly.entity';
import { ProductRankingYearlyEntity } from '@src/dashboard/entities/productRankingYearly.entity';

@Entity('products')
export class ProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'sku', type: 'varchar', length: 13, unique: true })
    sku: string;

    @Column({ name: 'product_unit_id', type: 'uuid' }) // FK: product_units.id
    productUnitId: string;

    @Column({ name: 'product_description', type: 'text', nullable: true })
    productDescription?: string;

    @Column({ name: 'import_price', type: 'decimal', precision: 10, scale: 2 })
    importPrice: number;

    @Column({ name: 'selling_price', type: 'decimal', precision: 10, scale: 2 })
    sellingPrice: number;

    @Column({ name: 'reorder_threshold', type: 'integer', nullable: true })
    reorderThreshold: number;

    @Column({ name: 'inventory_stock', type: 'integer', default: 0 })
    inventoryStock: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'stock_status', type: 'integer', enum: StockStatus })
    stockStatus: StockStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    // --- Relationships ---
    @OneToMany(() => ProductNamesEntity, (productName) => productName.product, { onDelete: 'CASCADE' })
    productNames: ProductNamesEntity[];

    @ManyToOne(() => ProductUnitsEntity, (productUnit) => productUnit.products)
    @JoinColumn({ name: 'product_unit_id', referencedColumnName: 'id' })
    productUnit: ProductUnitsEntity;

    @OneToMany(() => ProductStockHistoryEntity, (productStockHistory) => productStockHistory.product, { onDelete: 'CASCADE' })
    productStockHistory: ProductStockHistoryEntity[];

    @OneToMany(() => ProductsHistoryEntity, (productsHistory) => productsHistory.product, { onDelete: 'CASCADE' })
    productsHistory: ProductsHistoryEntity[];

    @OneToMany(() => ProductRankingDailyEntity, (ranking) => ranking.product, { onDelete: 'CASCADE' })
    dailyRankings: ProductRankingDailyEntity[];

    @OneToMany(() => ProductRankingMonthlyEntity, (ranking) => ranking.product, { onDelete: 'CASCADE' })
    monthlyRankings: ProductRankingMonthlyEntity[];

    @OneToMany(() => ProductRankingYearlyEntity, (ranking) => ranking.product, { onDelete: 'CASCADE' })
    yearlyRankings: ProductRankingYearlyEntity[];

}