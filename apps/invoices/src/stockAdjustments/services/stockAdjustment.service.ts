import { HttpStatus, Injectable } from '@nestjs/common';

// Import repositories.
import { StockAdjustmentRepository } from '../repositories/stockAdjustment.repository';
import { InvoiceHelperRepository } from '../../importInvoices/repositories/invoiceHelper.repository';
import { ImportInvoiceRepository } from '../../importInvoices/repositories/importInvoice.repository';

// Import DTOs.
import {
    CreateStockAdjustmentRequestDto,
    EditStockAdjustmentRequestDto,
    GetListOfStockAdjustmentRequestDto
} from '@app/common/dtos/invoices/stockAdjustments/crudStockAdjustmentRequest.dto';
import { StockAdjustmentResponseDto, GetListOfStockAdjustmentsResponseDto, StockAdjustmentWithoutProductsDto } from '@app/common/dtos/invoices/stockAdjustments/crudStockAdjustmentResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import entities.
import { StockAdjustmentEntity } from '../entities/stockAdjustment.entity';
import { StockAdjustmentProductsEntity } from '../entities/stockAdjustmentProducts.entity';

// Import enums.
import { StockAdjustmentStatus, ImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import mappers.
import { StockAdjustmentsMapper } from '@app/common/mappers/invoices/stockAdjustments.mapper';

// Import enums.
import { StockActionType } from '@app/common/enums/stockActionType.enum';

@Injectable()
export class StockAdjustmentService {
    constructor(
        private readonly stockAdjustmentRepository: StockAdjustmentRepository,
        private readonly invoiceHelperRepository: InvoiceHelperRepository,
        private readonly stockAdjustmentsMapper: StockAdjustmentsMapper,
        private readonly importInvoiceRepository: ImportInvoiceRepository,
    ) { }

    // --- DRY methods ---
    // Get an adjustment by ID.
    async getAdjustmentById(id: string): Promise<StockAdjustmentEntity> {
        const adjustment = await this.stockAdjustmentRepository.getStockAdjustmentById(id);
        if (!adjustment) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.STOCK_ADJUSTMENT_NOT_FOUND, `Stock adjustment with ID ${id} not found`);
        return adjustment;
    }

    // Map an adjustment to response DTO.
    async mapToResponseDto(adjustment: StockAdjustmentEntity): Promise<StockAdjustmentResponseDto> {
        const userIds = new Set<string>();
        if (adjustment.draftBy) userIds.add(adjustment.draftBy);
        if (adjustment.confirmedBy) userIds.add(adjustment.confirmedBy);

        let users: UserResponseDto[] = [];
        if (userIds.size > 0) {
            users = await this.invoiceHelperRepository.getUsersByIds(Array.from(userIds));
        }

        const draftByUsername = users.find(u => u.id === adjustment.draftBy)?.username;
        const confirmedByUsername = users.find(u => u.id === adjustment.confirmedBy)?.username;

        return this.stockAdjustmentsMapper.toStockAdjustmentResponseDto(
            adjustment,
            draftByUsername,
            confirmedByUsername
        );
    }

    // Map a list of adjustments to response DTOs without products.
    async mapToWithoutProductsDtoList(adjustments: StockAdjustmentEntity[]): Promise<StockAdjustmentWithoutProductsDto[]> {
        const userIds = new Set<string>();
        adjustments.forEach(adjustment => {
            if (adjustment.draftBy) userIds.add(adjustment.draftBy);
            if (adjustment.confirmedBy) userIds.add(adjustment.confirmedBy);
        });

        let users: UserResponseDto[] = [];
        if (userIds.size > 0) {
            users = await this.invoiceHelperRepository.getUsersByIds(Array.from(userIds));
        }

        return adjustments.map(adjustment => {
            const draftByUsername = users.find(u => u.id === adjustment.draftBy)?.username;
            const confirmedByUsername = users.find(u => u.id === adjustment.confirmedBy)?.username;

            return this.stockAdjustmentsMapper.toStockAdjustmentWithoutProductsDto(
                adjustment,
                draftByUsername,
                confirmedByUsername
            );
        });
    }

    // Check whether the productId exists and active.
    private async checkProductIdExistsAndActive(productIds: string[]): Promise<{ notFound: string[], notActive: string[] }> {
        const notFound: string[] = [];
        const notActive: string[] = [];

        const products = await Promise.all(
            productIds.map(id => this.invoiceHelperRepository.getProductById(id))
        );

        products.forEach((product, index) => {
            const id = productIds[index];
            if (!product) notFound.push(id);
            else if (!product.active) notActive.push(id);
        });

        return { notFound, notActive };
    }

    // Check if the product stock is enough to confirm.
    async checkProductStockBeforeConfirm(products: StockAdjustmentProductsEntity[]): Promise<void> {
        await Promise.all(products.map(async (product) => {

            // Only check for 'SUBTRACT' type because confirming it means substracting stock.
            if (product.type === StockActionType.SUBTRACT) {
                const currentProduct = await this.invoiceHelperRepository.getProductById(product.productId);
                if (!currentProduct) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `Product with ID ${product.productId} not found`);

                if (currentProduct.inventoryStock - product.quantity < 0) {
                    throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_STOCK_CANNOT_BE_NEGATIVE, `Product with ID ${product.productId} will have negative stock after confirmation.`);
                }
            }
        }));
    }

    // --- APIs ---
    // Create a new draft stock adjustment.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_STOCK_ADJUSTMENT_SERVICE)
    async createDraftStockAdjustment(dto: CreateStockAdjustmentRequestDto, user: AccessTokenPayload): Promise<StockAdjustmentResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > 64) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_STOCK_ADJUSTMENT_PRODUCTS, 'Too many products in stock adjustment. Maximum is 128.');

        // Check whether the productId exists and active.
        const productIds: string[] = dto.products.map(product => product.productId);
        const { notFound, notActive }: { notFound: string[], notActive: string[] } = await this.checkProductIdExistsAndActive(productIds);
        if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
        if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);

        const savedAdjustment = await this.stockAdjustmentRepository.createDraftStockAdjustment(dto, user);
        return await this.mapToResponseDto(savedAdjustment);
    }

    // Edit a draft stock adjustment.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_STOCK_ADJUSTMENT_SERVICE)
    async editDraftStockAdjustment(dto: EditStockAdjustmentRequestDto, user: AccessTokenPayload): Promise<StockAdjustmentResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > 64) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_STOCK_ADJUSTMENT_PRODUCTS, 'Too many products in stock adjustment. Maximum is 128.');

        // Get adjustment by ID.
        const adjustment: StockAdjustmentEntity = await this.getAdjustmentById(dto.id);

        // Check if adjustment is draft and user has permission to edit.
        if (adjustment.status !== StockAdjustmentStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.STOCK_ADJUSTMENT_NOT_DRAFT, 'Stock adjustment is not in draft status.');
        if (adjustment.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.STOCK_ADJUSTMENT_NO_PERMISSION_DRAFT, 'User has no permission to edit this stock adjustment.');

        // Check whether the productId exists and active.
        const productIds: string[] = dto.products.map(product => product.productId);
        const { notFound, notActive }: { notFound: string[], notActive: string[] } = await this.checkProductIdExistsAndActive(productIds);
        if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
        if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);

        const savedAdjustment = await this.stockAdjustmentRepository.editDraftStockAdjustment(dto, adjustment, user);
        return await this.mapToResponseDto(savedAdjustment);
    }

    // Delete draft stock adjustment.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_STOCK_ADJUSTMENT_SERVICE)
    async deleteDraftStockAdjustment(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        // Loop through IDs.
        for (const id of ids) {
            // Get adjustment by ID.
            const adjustment = await this.getAdjustmentById(id);

            // Check if adjustment is draft and user has permission to delete.
            if (adjustment.status !== StockAdjustmentStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.STOCK_ADJUSTMENT_NOT_DRAFT, 'Stock adjustment is not in draft status.');
            if (adjustment.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.STOCK_ADJUSTMENT_NO_PERMISSION_DRAFT, 'User has no permission to delete this stock adjustment.');
        }

        await this.stockAdjustmentRepository.deleteDraftStockAdjustment(ids);
        return true;
    }

    // Confirm a draft stock adjustment.
    @HandleServiceError(ErrorCode.CONFIRM_STOCK_ADJUSTMENT_SERVICE)
    async confirmStockAdjustment(id: string, user: AccessTokenPayload): Promise<StockAdjustmentResponseDto> {

        // Get adjustment by ID.
        const adjustment: StockAdjustmentEntity = await this.getAdjustmentById(id);

        // Check if adjustment is draft and user has permission to confirm.
        if (adjustment.status !== StockAdjustmentStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.STOCK_ADJUSTMENT_NOT_DRAFT, 'Stock adjustment is not in draft status.');
        if (adjustment.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.STOCK_ADJUSTMENT_NO_PERMISSION_DRAFT, 'User has no permission to confirm this stock adjustment.');

        // Check if the products are loaded.
        const products = adjustment.stockAdjustmentProducts || [];

        // Check whether the productId exists and active.
        const productIds: string[] = products.map(product => product.productId);
        const { notFound, notActive }: { notFound: string[], notActive: string[] } = await this.checkProductIdExistsAndActive(productIds);
        if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
        if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);

        await this.checkProductStockBeforeConfirm(products);

        // --- Import invoices ---
        // Check the import invoice status.
        if (adjustment.stockAdjustmentType === 'import_invoice' && adjustment.referenceId) {
            const importInvoice = await this.importInvoiceRepository.getImportInvoiceById(adjustment.referenceId);
            if (!importInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, 'Import invoice not found.');
            if (importInvoice.status !== ImportInvoiceStatus.CONFIRMED) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_CONFIRMED, 'Import invoice is not confirmed.');

            // Update the stock adjustment of import invoice.
            await this.importInvoiceRepository.increaseStockAdjustment(adjustment.referenceId);
        }

        // --- Selling invoices ---
        // Check the selling invoice status.
        else if (adjustment.stockAdjustmentType === 'selling_invoice' && adjustment.referenceId) {
            // await this.sellingInvoiceRepository.increaseStockAdjustment(confirmedAdjustment.referenceId);
        }

        // Confirm stock adjustment.
        const confirmedAdjustment = await this.stockAdjustmentRepository.confirmStockAdjustment(adjustment, user);
        if (!confirmedAdjustment) throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.CONFIRM_STOCK_ADJUSTMENT_SERVICE, 'Failed to confirm stock adjustment.');

        return await this.mapToResponseDto(confirmedAdjustment);
    }


    // Get stock adjustment by ID.
    @HandleServiceError(ErrorCode.GET_STOCK_ADJUSTMENT_BY_ID_SERVICE)
    async getStockAdjustmentById(id: string): Promise<StockAdjustmentResponseDto> {
        const adjustment = await this.getAdjustmentById(id);
        return await this.mapToResponseDto(adjustment);
    }

    // Get list of stock adjustments.
    @HandleServiceError(ErrorCode.GET_LIST_OF_STOCK_ADJUSTMENTS_SERVICE)
    async getListOfStockAdjustments(dto: GetListOfStockAdjustmentRequestDto, user: AccessTokenPayload): Promise<GetListOfStockAdjustmentsResponseDto> {
        const { data, total } = await this.stockAdjustmentRepository.getListOfStockAdjustments(dto, user);
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            stockAdjustments: await this.mapToWithoutProductsDtoList(data),
        };
    }
}
