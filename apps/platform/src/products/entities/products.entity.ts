import { Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Import enum
import { StockStatus } from '@app/common/enums/stockStatus.enum';

// Import entities.
import { ProductNamesEntity } from './productNames.entity';
import { ProductUnitsEntity } from './productUnits.entity';
import { ProductsHistoryEntity } from './history/productsHistory.entity';
import { ProductStockHistoryEntity } from './history/productStockHistory.entity';
import { ProductRankingDailyEntity } from '../../dashboard/entities/productRankingDaily.entity';
import { ProductRankingMonthlyEntity } from '../../dashboard/entities/productRankingMonthly.entity';
import { ProductRankingYearlyEntity } from '../../dashboard/entities/productRankingYearly.entity';

@Entity('products')
export class ProductsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'sku', type: 'varchar', length: 13, unique: true })
    sku: string;

    @OneToMany(() => ProductNamesEntity, (productName) => productName.product, { onDelete: 'CASCADE' })
    productNames: ProductNamesEntity[];

    @ManyToOne(() => ProductUnitsEntity, (productUnit) => productUnit.products)
    @JoinColumn({ name: 'product_unit', referencedColumnName: 'id' })
    productUnit: ProductUnitsEntity;

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

    @Column({ name: 'active', type: 'boolean', default: true })
    active: boolean;

    // 0: In stock.
    // 1: Reorder threshold reached.
    // 2: Out of stock.
    @Column({ name: 'stock_status', type: 'integer', enum: StockStatus })
    stockStatus: StockStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    // Relations.
    @OneToMany(() => ProductsHistoryEntity, (productsHistory) => productsHistory.product, { onDelete: 'CASCADE' })
    productsHistory: ProductsHistoryEntity[];

    @OneToMany(() => ProductStockHistoryEntity, (productStockHistory) => productStockHistory.product, { onDelete: 'CASCADE' })
    productStockHistory: ProductStockHistoryEntity[];

    @OneToMany(() => ProductRankingDailyEntity, (productRankingDaily) => productRankingDaily.product, { onDelete: 'CASCADE' })
    dailyRankings: ProductRankingDailyEntity[];

    @OneToMany(() => ProductRankingMonthlyEntity, (productRankingMonthly) => productRankingMonthly.product, { onDelete: 'CASCADE' })
    monthlyRankings: ProductRankingMonthlyEntity[];

    @OneToMany(() => ProductRankingYearlyEntity, (productRankingYearly) => productRankingYearly.product, { onDelete: 'CASCADE' })
    yearlyRankings: ProductRankingYearlyEntity[];
}