import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Import entities.
import { ImportInvoiceEntity } from '../entities/importInvoices.entity';

// Import repositories.
import { ImportInvoiceRepository } from '../repositories/importInvoice.repository';

// Import services.
import { ProductsService } from '@src/products/services/products.service';

// Import DTOs.
import {
    CreateImportInvoiceRequestDto,
    EditImportInvoiceRequestDto,
    GetListOfImportInvoiceRequestDto
} from '@libs/common/dtos/invoices/importInvoices/crudImportInvoicesRequest.dto';
import {
    ImportInvoiceResponseDto,
    GetListOfImportInvoicesResponseDto,
} from '@libs/common/dtos/invoices/importInvoices/crudImportInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import mappers.
import { ImportInvoicesMapper } from '@libs/common/mappers/importInvoices.mapper';

// Import enums.
import { ImportInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

@Injectable()
export class ImportInvoiceService {
    constructor(
        private readonly importInvoiceRepository: ImportInvoiceRepository,
        private readonly importInvoiceMapper: ImportInvoicesMapper,

        private readonly productsService: ProductsService,
        private readonly dataSource: DataSource,
    ) { }

    // --- DRY methods ---
    // Calculate invoice totals from products.
    private calculateInvoiceTotals(products: Array<{ productId: string; quantity: number; importPrice: number }>) {
        const totalProducts = new Set(products.map((product) => product.productId)).size;
        let totalQuantity = 0;
        let totalImportPrice = 0;

        products.forEach((product) => {
            totalQuantity += product.quantity;
            totalImportPrice += product.quantity * product.importPrice;
        });

        return {
            totalProducts,
            totalQuantity,
            totalImportPrice,
        };
    }

    // Get an invoice by ID.
    private async getInvoiceById(id: string): Promise<ImportInvoiceEntity> {
        const invoice = await this.importInvoiceRepository.getImportInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.IMPORT_INVOICE_NOT_FOUND, `Import invoice with ID ${id} not found`);
        return invoice;
    }

    // --- Public methods ---
    // Create a new draft import invoice.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_IMPORT_INVOICE_SERVICE)
    async createDraftImportInvoice(dto: CreateImportInvoiceRequestDto, user: AccessTokenPayload): Promise<ImportInvoiceResponseDto> {

        const uniqueProductIds: string[] = [...new Set(dto.products.map((p) => p.productId))];
        if (uniqueProductIds.length > 0) await this.productsService.getProductsByIds(uniqueProductIds);

        // Calculate invoice totals.
        const calculatedTotals = this.calculateInvoiceTotals(dto.products);

        // Save the invoice.
        const savedInvoice: ImportInvoiceEntity = await this.dataSource.transaction((manager) =>
            this.importInvoiceRepository.createDraftImportInvoice(dto, user, calculatedTotals, manager),
        );
        return this.importInvoiceMapper.toImportInvoiceResponseDto(savedInvoice);
    }

    // Edit a draft import invoice.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_IMPORT_INVOICE_SERVICE)
    async editDraftImportInvoice(dto: EditImportInvoiceRequestDto, user: AccessTokenPayload): Promise<ImportInvoiceResponseDto> {

        // Get invoice by ID.
        const invoice: ImportInvoiceEntity = await this.getInvoiceById(dto.id);

        // Check if invoice is draft and user has permission to edit.
        if (invoice.status !== ImportInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Invoice is not in draft status.');
        if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to edit this invoice.');

        // Check whether the productId exists and active.
        const uniqueProductIds: string[] = [...new Set(dto.products.map((p) => p.productId))];
        if (uniqueProductIds.length > 0) await this.productsService.getProductsByIds(uniqueProductIds);

        // Calculate invoice totals.
        const calculatedTotals = this.calculateInvoiceTotals(dto.products);

        // Edit the invoice.
        const savedInvoice = await this.dataSource.transaction((manager) =>
            this.importInvoiceRepository.editDraftImportInvoice(dto, invoice, user, calculatedTotals, manager),
        );
        return this.importInvoiceMapper.toImportInvoiceResponseDto(savedInvoice);
    }

    // Delete import invoices.
    // Draft invoices are removed permanently; confirmed ones are soft deleted, which also hides
    // their return import invoices. Soft deleted invoices cannot be restored.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_IMPORT_INVOICE_SERVICE)
    async deleteImportInvoices(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        const draftIds: string[] = [];
        const confirmedIds: string[] = [];

        // Loop through IDs.
        for (const id of ids) {
            // Get invoice by ID.
            const invoice = await this.getInvoiceById(id);

            if (invoice.status === ImportInvoiceStatus.DRAFT) {
                // Check if user has permission to delete the draft.
                if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to delete this invoice.');
                draftIds.push(id);
            } else {
                confirmedIds.push(id);
            }
        }

        // Delete the invoices.
        await this.dataSource.transaction(async (manager) => {
            await this.importInvoiceRepository.deleteDraftImportInvoice(draftIds, manager);
            await this.importInvoiceRepository.softDeleteImportInvoices(confirmedIds, manager);
        });
        return true;
    }

    // Confirm a draft import invoice.
    @HandleServiceError(ErrorCode.CONFIRM_IMPORT_INVOICE_SERVICE)
    async confirmImportInvoice(id: string, user: AccessTokenPayload): Promise<ImportInvoiceResponseDto> {

        // Get invoice by ID.
        const invoice: ImportInvoiceEntity = await this.getInvoiceById(id);

        // Check if invoice is draft and user has permission to confirm.
        if (invoice.status !== ImportInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Invoice is not in draft status.');
        if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to confirm this invoice.');

        // Check whether the productId exists and active.
        const lineProducts = invoice.importInvoiceProducts ?? [];
        const uniqueProductIds: string[] = [...new Set(lineProducts.map((p) => p.productId))];
        if (uniqueProductIds.length > 0) await this.productsService.getProductsByIds(uniqueProductIds);

        // Confirm the invoice.
        const confirmedInvoice = await this.dataSource.transaction((manager) =>
            this.importInvoiceRepository.confirmImportInvoice(invoice, user, manager),
        );
        if (!confirmedInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Invoice is not in draft status.');

        return this.importInvoiceMapper.toImportInvoiceResponseDto(confirmedInvoice);
    }

    // Get import invoice by ID.
    @HandleServiceError(ErrorCode.GET_IMPORT_INVOICE_BY_ID_SERVICE)
    async getImportInvoiceById(id: string): Promise<ImportInvoiceResponseDto> {
        const invoice = await this.getInvoiceById(id);
        return this.importInvoiceMapper.toImportInvoiceResponseDto(invoice);
    }

    // Get list of import invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_IMPORT_INVOICES_SERVICE)
    async getListOfImportInvoices(dto: GetListOfImportInvoiceRequestDto): Promise<GetListOfImportInvoicesResponseDto> {
        const { data, total } = await this.importInvoiceRepository.getListOfImportInvoices(dto);

        // Map the invoices to the response DTO.
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: data.map((invoice) => this.importInvoiceMapper.toImportInvoiceWithoutProductsDto(invoice)),
        };
    }
}
