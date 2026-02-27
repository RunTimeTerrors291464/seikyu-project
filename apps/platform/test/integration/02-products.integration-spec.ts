import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Import entities.
import { UserEntity } from '../../src/users/entities/user.entity';
import { UserRoleEntity } from '../../src/users/entities/userRole.entity';
import { ProductsEntity } from '../../src/products/entities/products.entity';
import { ProductUnitsEntity } from '../../src/products/entities/productUnits.entity';
import { ProductNamesEntity } from '../../src/products/entities/productNames.entity';
import { ProductUnitsHistoryEntity } from '../../src/products/entities/history/productUnitsHistory.entity';
import { ProductsHistoryEntity } from '../../src/products/entities/history/productsHistory.entity';
import { ProductStockHistoryEntity } from '../../src/products/entities/history/productStockHistory.entity';

// Import modules.
import { UsersModule } from '../../src/users/users.module';
import { ProductsModule } from '../../src/products/products.module';

// Import services.
import { UsersService } from '../../src/users/services/users.service';
import { ProductUnitsService } from '../../src/products/services/productUnits.service';
import { ProductsService } from '../../src/products/services/products.service';

// Import DTOs.
import { CreateProductUnitRequestDto, EditProductUnitRequestDto, GetListOfProductUnitRequestDto } from '../../../../libs/common/src/dtos/platform/products/crudProductUnitRequest.dto';
import { ProductUnitResponseDto, GetListOfProductUnitResponseDto } from '../../../../libs/common/src/dtos/platform/products/crudProductunitResponse.dto';
import { CreateProductRequestDto, EditProductRequestDto, GetListOfProductRequestDto } from '../../../../libs/common/src/dtos/platform/products/crudProductRequest.dto';
import { ProductResponseDto, GetListOfProductResponseDto } from '../../../../libs/common/src/dtos/platform/products/crudProductResponse.dto';
import type { AccessTokenPayload } from '../../../../libs/common/src/dtos/api-gateway/auth/jwtPayload.interface';
import { UserResponseDto } from '../../../../libs/common/src/dtos/platform/users/crudUsersReponse.dto';

// Import enums.
import { Role } from '../../../../libs/common/src/enums/role.enum';

// Import error handling.
import { CustomException } from '../../../../libs/common/src/error-exceptions/customException';

// integrationState is available but we look up manager_test directly from the DB
// to avoid relying on module-cache ordering for the user ID.

/**
 * Integration tests for the Products module — uses a real PostgreSQL database.
 *
 * Prerequisites (provided by 01-users spec running first):
 *   - integrationState.adminUserId   → admin user (ADMIN role)
 *   - integrationState.cashierUserId → cashier user (CASHIER role)
 *   - integrationState.managerUserId → manager user (MANAGER role) — created in this file's beforeAll
 *
 * Test flow:
 *   1. ProductUnits  → create, edit, getById, getList, deactivate, activate
 *   2. Products      → create, edit, getById, getBySku, getList, deactivate, activate
 *
 * Run: npm run test:integration:platform
 */

describe('Products Integration Tests (Real DB)', () => {
    let module: TestingModule;
    let dataSource: DataSource;
    let productUnitsService: ProductUnitsService;
    let productsService: ProductsService;

    // AccessTokenPayload for manager_test — resolved from DB in beforeAll.
    let managerUser: AccessTokenPayload;

    // Data persisted across tests.
    let createdProductUnit: ProductUnitResponseDto;
    let createdProduct: ProductResponseDto;

    // ─── SETUP ───────────────────────────────────────────────────────────

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),

                // Connect to the real DB using environment variables.
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => ({
                        type: 'postgres',
                        host: configService.getOrThrow('DB_HOST_PLATFORM'),
                        port: parseInt(configService.getOrThrow('DB_PORT_PLATFORM')),
                        username: configService.getOrThrow('DB_USERNAME_PLATFORM'),
                        password: configService.getOrThrow('DB_PASSWORD_PLATFORM'),
                        database: configService.getOrThrow('DB_DATABASE_PLATFORM'),
                        entities: [
                            UserEntity,
                            UserRoleEntity,
                            ProductsEntity,
                            ProductUnitsEntity,
                            ProductNamesEntity,
                            ProductUnitsHistoryEntity,
                            ProductsHistoryEntity,
                            ProductStockHistoryEntity,
                        ],
                        synchronize: false,
                        logging: false,
                    }),
                    inject: [ConfigService],
                }),

                TypeOrmModule.forFeature([
                    UserEntity,
                    UserRoleEntity,
                    ProductsEntity,
                    ProductUnitsEntity,
                    ProductNamesEntity,
                    ProductUnitsHistoryEntity,
                    ProductsHistoryEntity,
                    ProductStockHistoryEntity,
                ]),

                // UsersModule is needed by ProductsModule (UsersRepository dependency).
                UsersModule,
                ProductsModule,
            ],
        }).compile();

        productUnitsService = module.get<ProductUnitsService>(ProductUnitsService);
        productsService = module.get<ProductsService>(ProductsService);
        dataSource = module.get<DataSource>(DataSource);

        // Clean up any leftover product data from previous partial/failed runs.
        // This prevents "already exists" errors when re-running tests without a
        // successful teardown (e.g., after a compilation error on a previous run).
        await dataSource.query('DELETE FROM product_stock_history');
        await dataSource.query('DELETE FROM products_history');
        await dataSource.query('DELETE FROM product_units_history');
        await dataSource.query('DELETE FROM product_names');
        await dataSource.query('DELETE FROM products');
        await dataSource.query('DELETE FROM product_units');

        // Resolve manager_test from the DB directly — more reliable than reading
        // integrationState since it doesn't depend on module-cache ordering.
        const usersService = module.get<UsersService>(UsersService);
        const manager = await usersService.getUserByUsername('manager_test', false) as UserResponseDto;
        managerUser = {
            id: manager.id,
            username: manager.username,
            roles: manager.roles,
            refreshTokenId: 'test-refresh-token-id',
        };
    }, 30000);

    afterAll(async () => {
        // Do not clean up here — globalTeardown deletes all DB data after
        // ALL spec files have finished.
        await dataSource.destroy();
        await module.close();
    }, 15000);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. PRODUCT UNITS
    // ═══════════════════════════════════════════════════════════════════════

    describe('1. ProductUnits', () => {

        // ─── CREATE PRODUCT UNIT ──────────────────────────────────────────

        describe('createNewProductUnit', () => {
            it('should create a new product unit successfully', async () => {
                const dto: CreateProductUnitRequestDto = {
                    unitName: 'kg',
                    unitDescription: 'Kilogram',
                };

                const result = await productUnitsService.createNewProductUnit(dto, managerUser);

                createdProductUnit = result;

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.unitName).toBe('kg');
                expect(result.unitDescription).toBe('Kilogram');
                expect(result.active).toBe(true);
                expect(result.createdAt).toBeDefined();
                expect(result.updatedAt).toBeDefined();
            });

            it('should throw error when creating product unit with existing unit name', async () => {
                const dto: CreateProductUnitRequestDto = {
                    unitName: 'kg', // Already taken.
                };

                await expect(
                    productUnitsService.createNewProductUnit(dto, managerUser),
                ).rejects.toThrow(CustomException);
            });

            it('should create a second product unit for filter tests', async () => {
                const dto: CreateProductUnitRequestDto = {
                    unitName: 'box',
                    unitDescription: 'Box unit',
                };

                const result = await productUnitsService.createNewProductUnit(dto, managerUser);

                expect(result).toBeDefined();
                expect(result.unitName).toBe('box');
            });
        });

        // ─── EDIT PRODUCT UNIT ────────────────────────────────────────────

        describe('editProductUnit', () => {
            it('should edit product unit description', async () => {
                const dto: EditProductUnitRequestDto = {
                    id: createdProductUnit.id,
                    unitDescription: 'Kilogram - updated',
                };

                const result = await productUnitsService.editProductUnit(dto, managerUser);

                expect(result).toBeDefined();
                expect(result.unitDescription).toBe('Kilogram - updated');
                // Unit name should remain unchanged.
                expect(result.unitName).toBe('kg');
            });

            it('should throw error when editing with existing unit name', async () => {
                const dto: EditProductUnitRequestDto = {
                    id: createdProductUnit.id,
                    unitName: 'box', // Already taken by second unit.
                };

                await expect(
                    productUnitsService.editProductUnit(dto, managerUser),
                ).rejects.toThrow(CustomException);
            });

            it('should throw error when editing non-existent product unit', async () => {
                const dto: EditProductUnitRequestDto = {
                    id: '00000000-0000-0000-0000-000000000000',
                    unitDescription: 'Ghost',
                };

                await expect(
                    productUnitsService.editProductUnit(dto, managerUser),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── GET PRODUCT UNIT BY ID ───────────────────────────────────────

        describe('getProductUnitById', () => {
            it('should get product unit by id', async () => {
                const result = await productUnitsService.getProductUnitByIdResponseDto(createdProductUnit.id);

                expect(result).toBeDefined();
                expect(result.id).toBe(createdProductUnit.id);
                expect(result.unitName).toBe('kg');
            });

            it('should throw error when product unit id does not exist', async () => {
                await expect(
                    productUnitsService.getProductUnitByIdResponseDto('00000000-0000-0000-0000-000000000000'),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── GET LIST OF PRODUCT UNITS ────────────────────────────────────

        describe('getListOfProductUnits', () => {
            it('should get paginated list of product units', async () => {
                const dto: GetListOfProductUnitRequestDto = { page: 1, limit: 10 };

                const result: GetListOfProductUnitResponseDto = await productUnitsService.getListOfProductUnits(dto);

                expect(result).toBeDefined();
                expect(result.page).toBe(1);
                expect(result.limit).toBe(10);
                expect(result.total).toBeGreaterThanOrEqual(2); // kg + box.
                expect(result.productUnits).toBeInstanceOf(Array);
            });

            it('should search product units by unit name', async () => {
                const dto: GetListOfProductUnitRequestDto = { page: 1, limit: 10, search: 'kg' };

                const result = await productUnitsService.getListOfProductUnits(dto);

                expect(result.total).toBeGreaterThanOrEqual(1);
                result.productUnits.forEach((unit: ProductUnitResponseDto) => {
                    expect(unit.unitName.toLowerCase()).toContain('kg');
                });
            });

            it('should filter product units by active status', async () => {
                const dto: GetListOfProductUnitRequestDto = { page: 1, limit: 10, active: 'true' };

                const result = await productUnitsService.getListOfProductUnits(dto);

                result.productUnits.forEach((unit: ProductUnitResponseDto) => {
                    expect(unit.active).toBe(true);
                });
            });
        });

        // ─── DEACTIVATE PRODUCT UNIT ──────────────────────────────────────

        describe('deactivateProductUnit', () => {
            it('should deactivate a product unit', async () => {
                const result = await productUnitsService.deactivateProductUnit(createdProductUnit.id, managerUser);

                expect(result).toBeDefined();
                expect(result.active).toBe(false);
            });

            it('should throw error when deactivating already deactivated product unit', async () => {
                await expect(
                    productUnitsService.deactivateProductUnit(createdProductUnit.id, managerUser),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── ACTIVATE PRODUCT UNIT ────────────────────────────────────────

        describe('activateProductUnit', () => {
            it('should activate a deactivated product unit', async () => {
                const result = await productUnitsService.activateProductUnit(createdProductUnit.id, managerUser);

                expect(result).toBeDefined();
                expect(result.active).toBe(true);
            });

            it('should throw error when activating already active product unit', async () => {
                await expect(
                    productUnitsService.activateProductUnit(createdProductUnit.id, managerUser),
                ).rejects.toThrow(CustomException);
            });
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 2. PRODUCTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('2. Products', () => {

        // ─── CREATE PRODUCT ───────────────────────────────────────────────

        describe('createNewProduct', () => {
            it('should create a new product successfully', async () => {
                const dto: CreateProductRequestDto = {
                    sku: '1234567890123',
                    productNames: ['Test Product', 'San Pham Test'],
                    productUnitId: createdProductUnit.id,
                    productDescription: 'A test product description',
                    importPrice: 100.00,
                    sellingPrice: 150.00,
                    reorderThreshold: 10,
                };

                const result = await productsService.createNewProduct(dto, managerUser);

                createdProduct = result;

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.sku).toBe('1234567890123');
                expect(result.productNames).toEqual(expect.arrayContaining(['Test Product', 'San Pham Test']));
                expect(result.productUnitId).toBe(createdProductUnit.id);
                expect(result.productUnitName).toBe('kg');
                expect(result.productDescription).toBe('A test product description');
                expect(Number(result.importPrice)).toBe(100);
                expect(Number(result.sellingPrice)).toBe(150);
                expect(Number(result.reorderThreshold)).toBe(10);
                expect(Number(result.inventoryStock)).toBe(0); // Default out of stock.
                expect(result.active).toBe(true);
            });

            it('should throw error when creating product with existing SKU', async () => {
                const dto: CreateProductRequestDto = {
                    sku: '1234567890123', // Already taken.
                    productNames: ['Duplicate Product'],
                    productUnitId: createdProductUnit.id,
                    importPrice: 50.00,
                    sellingPrice: 75.00,
                };

                await expect(
                    productsService.createNewProduct(dto, managerUser),
                ).rejects.toThrow(CustomException);
            });

            it('should throw error when product unit id does not exist', async () => {
                const dto: CreateProductRequestDto = {
                    sku: '9999999999999',
                    productNames: ['Ghost Product'],
                    productUnitId: '00000000-0000-0000-0000-000000000000',
                    importPrice: 50.00,
                    sellingPrice: 75.00,
                };

                await expect(
                    productsService.createNewProduct(dto, managerUser),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── EDIT PRODUCT ─────────────────────────────────────────────────

        describe('editProduct', () => {
            it('should edit product prices and description', async () => {
                const dto: EditProductRequestDto = {
                    id: createdProduct.id,
                    productDescription: 'Updated description',
                    importPrice: 120.00,
                    sellingPrice: 180.00,
                };

                const result = await productsService.editProduct(dto, managerUser);

                expect(result).toBeDefined();
                expect(result.productDescription).toBe('Updated description');
                expect(Number(result.importPrice)).toBe(120);
                expect(Number(result.sellingPrice)).toBe(180);
                // SKU should remain unchanged.
                expect(result.sku).toBe('1234567890123');
            });

            it('should throw error when editing with an already taken SKU', async () => {
                // Create a second product first.
                await productsService.createNewProduct({
                    sku: '9876543210987',
                    productNames: ['Second Product'],
                    productUnitId: createdProductUnit.id,
                    importPrice: 50.00,
                    sellingPrice: 75.00,
                }, managerUser);

                // Try to update first product's SKU to the second product's SKU.
                const dto: EditProductRequestDto = {
                    id: createdProduct.id,
                    sku: '9876543210987', // Already taken.
                };

                await expect(
                    productsService.editProduct(dto, managerUser),
                ).rejects.toThrow(CustomException);
            });

            it('should throw error when editing non-existent product', async () => {
                const dto: EditProductRequestDto = {
                    id: '00000000-0000-0000-0000-000000000000',
                    productDescription: 'Ghost',
                };

                await expect(
                    productsService.editProduct(dto, managerUser),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── GET PRODUCT BY ID ────────────────────────────────────────────

        describe('getProductById', () => {
            it('should get product by id', async () => {
                const result = await productsService.getProductByIdResponseDto(createdProduct.id);

                expect(result).toBeDefined();
                expect(result.id).toBe(createdProduct.id);
                expect(result.sku).toBe('1234567890123');
            });

            it('should throw error when product id does not exist', async () => {
                await expect(
                    productsService.getProductByIdResponseDto('00000000-0000-0000-0000-000000000000'),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── GET PRODUCT BY SKU ───────────────────────────────────────────

        describe('getProductBySku', () => {
            it('should get product by sku', async () => {
                const result = await productsService.getProductBySkuResponseDto('1234567890123');

                expect(result).toBeDefined();
                expect(result.sku).toBe('1234567890123');
                expect(result.id).toBe(createdProduct.id);
            });

            it('should throw error when sku does not exist', async () => {
                await expect(
                    productsService.getProductBySkuResponseDto('0000000000000'),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── GET LIST OF PRODUCTS ─────────────────────────────────────────

        describe('getListOfProducts', () => {
            it('should get paginated list of products', async () => {
                const dto: GetListOfProductRequestDto = { page: 1, limit: 10 };

                const result: GetListOfProductResponseDto = await productsService.getListOfProducts(dto);

                expect(result).toBeDefined();
                expect(result.page).toBe(1);
                expect(result.limit).toBe(10);
                expect(result.total).toBeGreaterThanOrEqual(2); // first + second product.
                expect(result.products).toBeInstanceOf(Array);
            });

            it('should filter products by active status', async () => {
                const dto: GetListOfProductRequestDto = { page: 1, limit: 10, active: 'true' };

                const result = await productsService.getListOfProducts(dto);

                result.products.forEach((product: ProductResponseDto) => {
                    expect(product.active).toBe(true);
                });
            });
        });

        // ─── DEACTIVATE PRODUCT ───────────────────────────────────────────

        describe('deactivateProduct', () => {
            it('should deactivate a product', async () => {
                const result = await productsService.deactivateProduct(createdProduct.id, managerUser);

                expect(result).toBeDefined();
                expect(result.active).toBe(false);
            });

            it('should throw error when deactivating already deactivated product', async () => {
                await expect(
                    productsService.deactivateProduct(createdProduct.id, managerUser),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── ACTIVATE PRODUCT ─────────────────────────────────────────────

        describe('activateProduct', () => {
            it('should activate a deactivated product', async () => {
                const result = await productsService.activateProduct(createdProduct.id, managerUser);

                expect(result).toBeDefined();
                expect(result.active).toBe(true);
            });

            it('should throw error when activating already active product', async () => {
                await expect(
                    productsService.activateProduct(createdProduct.id, managerUser),
                ).rejects.toThrow(CustomException);
            });
        });
    });
});
