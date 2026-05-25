import { MigrationInterface, QueryRunner } from 'typeorm';

export class INVOICESv2AddInvoiceProductSkuSearchIndexes1775287443507 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_products_product_sku_trigram
            ON selling_invoice_products USING GIN (product_sku gin_trgm_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_products_product_sku_trigram
            ON return_selling_invoice_products USING GIN (product_sku gin_trgm_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_products_product_sku_trigram
            ON import_invoice_products USING GIN (product_sku gin_trgm_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_products_product_sku_trigram
            ON return_import_invoice_products USING GIN (product_sku gin_trgm_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_products_stock_adjustment_invoice_id
            ON stock_adjustment_invoice_products (stock_adjustment_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_products_product_id
            ON stock_adjustment_invoice_products (product_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_products_product_id_stock_adjustment_invoice_id
            ON stock_adjustment_invoice_products (product_id, stock_adjustment_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_products_product_sku_trigram
            ON stock_adjustment_invoice_products USING GIN (product_sku gin_trgm_ops)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_products_product_sku_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_products_product_id_stock_adjustment_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_products_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_products_stock_adjustment_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_products_product_sku_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_products_product_sku_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_products_product_sku_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_products_product_sku_trigram`);
    }
}
