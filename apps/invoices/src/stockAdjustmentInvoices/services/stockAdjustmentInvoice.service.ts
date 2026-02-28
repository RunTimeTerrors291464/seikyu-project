import { HttpStatus, Injectable } from '@nestjs/common';

// Import repositories.
import { StockAdjustmentInvoiceRepository } from '../repositories/stockAdjustmentInvoice.repository';
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Import DTOs.
import {
    CreateStockAdjustmentInvoiceRequestDto,
    EditStockAdjustmentInvoiceRequestDto,
    GetListOfStockAdjustmentInvoiceRequestDto,
} from '@app/common/dtos/invoices/stockAdjustmentInvoices/crudStockAdjustmentInvoicesRequest.dto';
import {
    StockAdjustmentInvoiceResponseDto,
    GetListOfStockAdjustmentInvoicesResponseDto,
    StockAdjustmentInvoiceWithoutProductsDto,
} from '@app/common/dtos/invoices/stockAdjustmentInvoices/crudStockAdjustmentInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import entities.
import { StockAdjustmentInvoiceEntity } from '../entities/stockAdjustmentInvoices.entity';

// Import mappers.
import { StockAdjustmentInvoicesMapper } from '@app/common/mappers/invoices/stockAdjustmentInvoices.mapper';

// Import enums.
import { StockAdjustmentInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@Injectable()
export class StockAdjustmentInvoiceService {
    constructor(
        private readonly stockAdjustmentInvoiceRepository: StockAdjustmentInvoiceRepository,
        private readonly invoiceHelperService: InvoiceHelperService,
        private readonly stockAdjustmentInvoicesMapper: StockAdjustmentInvoicesMapper,
    ) { }

    // --- Constants ---
    private readonly _maxProductsPerInvoice = 64;

    // --- DRY methods ---
    // Calculate invoice totals from products.
    private calculateInvoiceTotals(products: Array<{ quantity: number }>) {
        return {
            totalProducts: products.length,
            totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
        };
    }

    // Get an invoice by ID or throw.
    private async getInvoiceById(id: string): Promise<StockAdjustmentInvoiceEntity> {
        const invoice = await this.stockAdjustmentInvoiceRepository.getStockAdjustmentInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Invoice with ID ${id} not found`);
        return invoice;
    }

    // Map an invoice to response DTO (with products).
    private async mapToResponseDto(invoice: StockAdjustmentInvoiceEntity): Promise<StockAdjustmentInvoiceResponseDto> {
        const userIds = new Set<string>();
        if (invoice.draftBy) userIds.add(invoice.draftBy);
        if (invoice.confirmedBy) userIds.add(invoice.confirmedBy);

        let users: UserResponseDto[] = [];
        if (userIds.size > 0) {
            users = await this.invoiceHelperService.getUsersByIds(Array.from(userIds));
        }

        const draftByUsername = users.find(u => u.id === invoice.draftBy)?.username;
        const confirmedByUsername = users.find(u => u.id === invoice.confirmedBy)?.username;

        return this.stockAdjustmentInvoicesMapper.toStockAdjustmentInvoiceResponseDto(
            invoice,
            draftByUsername,
            confirmedByUsername,
        );
    }

    // Map a list of invoices to without-products DTOs.
    private async mapToWithoutProductsDtoList(invoices: StockAdjustmentInvoiceEntity[]): Promise<StockAdjustmentInvoiceWithoutProductsDto[]> {
        const userIds = new Set<string>();
        invoices.forEach(invoice => {
            if (invoice.draftBy) userIds.add(invoice.draftBy);
            if (invoice.confirmedBy) userIds.add(invoice.confirmedBy);
        });

        let users: UserResponseDto[] = [];
        if (userIds.size > 0) {
            users = await this.invoiceHelperService.getUsersByIds(Array.from(userIds));
        }

        return invoices.map(invoice => {
            const draftByUsername = users.find(u => u.id === invoice.draftBy)?.username;
            const confirmedByUsername = users.find(u => u.id === invoice.confirmedBy)?.username;
            return this.stockAdjustmentInvoicesMapper.toStockAdjustmentInvoiceWithoutProductsDto(
                invoice,
                draftByUsername,
                confirmedByUsername,
            );
        });
    }

    // --- APIs ---
    // Create a new draft stock adjustment invoice.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_STOCK_ADJUSTMENT_INVOICE_SERVICE)
    async createDraftStockAdjustmentInvoice(dto: CreateStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {

        // Check product count limit.
        if (dto.products.length > this._maxProductsPerInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_STOCK_ADJUSTMENT_INVOICE_PRODUCTS, `Too many products in stock adjustment invoice. Maximum is ${this._maxProductsPerInvoice}.`);

        // Check whether the productIds exist and are active.
        const productIds = dto.products.map(p => p.productId);
        const { success, notFound, notActive } = await this.invoiceHelperService.checkProductIdExistsAndActive(productIds);
        if (!success) {
            if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
            if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);
        }

        // Calculate totals.
        const calculatedTotals = this.calculateInvoiceTotals(dto.products);

        // Save the draft invoice.
        const savedInvoice = await this.stockAdjustmentInvoiceRepository.createDraftStockAdjustmentInvoice(dto, user, calculatedTotals);
        return await this.mapToResponseDto(savedInvoice);
    }

    // Edit a draft stock adjustment invoice.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_STOCK_ADJUSTMENT_INVOICE_SERVICE)
    async editDraftStockAdjustmentInvoice(dto: EditStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {

        // Check product count limit.
        if (dto.products.length > this._maxProductsPerInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_STOCK_ADJUSTMENT_INVOICE_PRODUCTS, `Too many products in stock adjustment invoice. Maximum is ${this._maxProductsPerInvoice}.`);

        // Get invoice by ID.
        const invoice = await this.getInvoiceById(dto.id);

        // Must be draft and owned by this user.
        if (invoice.status !== StockAdjustmentInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Invoice is not in draft status.');
        if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to edit this invoice.');

        // Check whether the productIds exist and are active.
        const productIds = dto.products.map(p => p.productId);
        const { success, notFound, notActive } = await this.invoiceHelperService.checkProductIdExistsAndActive(productIds);
        if (!success) {
            if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
            if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);
        }

        // Calculate totals.
        const calculatedTotals = this.calculateInvoiceTotals(dto.products);

        // Save the updated draft invoice.
        const savedInvoice = await this.stockAdjustmentInvoiceRepository.editDraftStockAdjustmentInvoice(dto, invoice, calculatedTotals, user);
        return await this.mapToResponseDto(savedInvoice);
    }

    // Delete draft stock adjustment invoices.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_STOCK_ADJUSTMENT_INVOICE_SERVICE)
    async deleteDraftStockAdjustmentInvoice(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        for (const id of ids) {
            const invoice = await this.getInvoiceById(id);
            if (invoice.status !== StockAdjustmentInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Invoice is not in draft status.');
            if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to delete this invoice.');
        }

        await this.stockAdjustmentInvoiceRepository.deleteDraftStockAdjustmentInvoice(ids);
        return true;
    }

    // Confirm a draft stock adjustment invoice.
    @HandleServiceError(ErrorCode.CONFIRM_STOCK_ADJUSTMENT_INVOICE_SERVICE)
    async confirmStockAdjustmentInvoice(id: string, user: AccessTokenPayload): Promise<StockAdjustmentInvoiceResponseDto> {

        // Get invoice by ID.
        const invoice = await this.getInvoiceById(id);

        // Must be draft and owned by this user.
        if (invoice.status !== StockAdjustmentInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Invoice is not in draft status.');
        if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to confirm this invoice.');

        // Check whether the productIds still exist and are active.
        const productIds = invoice.stockAdjustmentInvoiceProducts.map(p => p.productId);
        const { success, notFound, notActive } = await this.invoiceHelperService.checkProductIdExistsAndActive(productIds);
        if (!success) {
            if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
            if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);
        }

        // Confirm invoice.
        const confirmedInvoice = await this.stockAdjustmentInvoiceRepository.confirmStockAdjustmentInvoice(invoice, user);
        if (!confirmedInvoice) throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.CONFIRM_STOCK_ADJUSTMENT_INVOICE_SERVICE, 'Failed to confirm invoice.');

        return await this.mapToResponseDto(confirmedInvoice);
    }

    // Get stock adjustment invoice by ID.
    @HandleServiceError(ErrorCode.GET_STOCK_ADJUSTMENT_INVOICE_BY_ID_SERVICE)
    async getStockAdjustmentInvoiceById(id: string): Promise<StockAdjustmentInvoiceResponseDto> {
        const invoice = await this.getInvoiceById(id);
        return await this.mapToResponseDto(invoice);
    }

    // Get list of stock adjustment invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_STOCK_ADJUSTMENT_INVOICES_SERVICE)
    async getListOfStockAdjustmentInvoices(dto: GetListOfStockAdjustmentInvoiceRequestDto, user: AccessTokenPayload): Promise<GetListOfStockAdjustmentInvoicesResponseDto> {
        const { data, total } = await this.stockAdjustmentInvoiceRepository.getListOfStockAdjustmentInvoices(dto, user);
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: await this.mapToWithoutProductsDtoList(data),
        };
    }
}
