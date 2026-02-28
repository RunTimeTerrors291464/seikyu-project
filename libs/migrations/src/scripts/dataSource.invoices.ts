import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Invoices application entities.
import { ImportInvoiceEntity } from '../../../../apps/invoices/src/importInvoices/entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from '../../../../apps/invoices/src/importInvoices/entities/importInvocieProducts.entity';
import { ReturnImportInvoiceEntity } from '../../../../apps/invoices/src/returnImportInvoices/entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from '../../../../apps/invoices/src/returnImportInvoices/entities/returnImportInvoiceProducts.entity';
import { SellingInvoiceEntity } from '../../../../apps/invoices/src/sellingInvoices/entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '../../../../apps/invoices/src/sellingInvoices/entities/sellingInvoiceProducts.entity';
import { ReturnSellingInvoiceEntity } from '../../../../apps/invoices/src/returnSellingInvoices/entities/returnSellingInvoices.entity';
import { ReturnSellingInvoiceProductsEntity } from '../../../../apps/invoices/src/returnSellingInvoices/entities/returnSellingInvoiceProducts.entity';
import { StockAdjustmentInvoiceEntity } from '../../../../apps/invoices/src/stockAdjustmentInvoices/entities/stockAdjustmentInvoices.entity';
import { StockAdjustmentInvoiceProductsEntity } from '../../../../apps/invoices/src/stockAdjustmentInvoices/entities/stockAdjustmentInvoiceProducts.entity';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// Data source for invoicesService.
export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST_INVOICES,
    port: parseInt(process.env.DB_PORT_INVOICES || '5432'),
    username: process.env.DB_USERNAME_INVOICES,
    password: process.env.DB_PASSWORD_INVOICES,
    database: process.env.DB_DATABASE_INVOICES,
    entities: [
        ImportInvoiceEntity,
        ImportInvoiceProductsEntity,
        ReturnImportInvoiceEntity,
        ReturnImportInvoiceProductsEntity,
        SellingInvoiceEntity,
        SellingInvoiceProductsEntity,
        ReturnSellingInvoiceEntity,
        ReturnSellingInvoiceProductsEntity,
        StockAdjustmentInvoiceEntity,
        StockAdjustmentInvoiceProductsEntity,
    ],
    migrations: [path.join(__dirname, '../invoices/*.{ts,js}')],
    synchronize: false,
    logging: true,
});
