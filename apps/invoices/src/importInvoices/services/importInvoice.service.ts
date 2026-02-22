import { HttpStatus, Injectable } from '@nestjs/common';

// Import repositories.
import { ImportInvoiceRepository } from '../repositories/importInvoice.repository';
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Import DTOs.
import {
    CreateImportInvoiceRequestDto,
    EditImportInvoiceRequestDto,
    GetListOfImportInvoiceRequestDto
} from '@app/common/dtos/invoices/importInvoices/crudImportInvoicesRequest.dto';
import {
    ImportInvoiceResponseDto,
    GetListOfImportInvoicesResponseDto,
    ImportInvoiceWithoutProductsDto
} from '@app/common/dtos/invoices/importInvoices/crudImportInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import entities.
import { ImportInvoiceEntity } from '../entities/importInvoices.entity';

// Import mappers.
import { ImportInvoicesMapper } from '@app/common/mappers/invoices/importInvoices.mapper';

// Import enums.
import { ImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@Injectable()
export class ImportInvoiceService {
    constructor(
        private readonly importInvoiceRepository: ImportInvoiceRepository,
        private readonly invoiceHelperService: InvoiceHelperService,
        private readonly importInvoicesMapper: ImportInvoicesMapper,
    ) { }

    // --- Constants ---
    private readonly _maxProductsPerImportInvoice = 64;

    // --- DRY methods ---
    // Get an invoice by ID.
    private async getInvoiceById(id: string): Promise<ImportInvoiceEntity> {
        const invoice = await this.importInvoiceRepository.getImportInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Invoice with ID ${id} not found`);
        return invoice;
    }

    // Map an invoice to response DTO.
    private async mapToResponseDto(invoice: ImportInvoiceEntity): Promise<ImportInvoiceResponseDto> {
        const userIds = new Set<string>();
        if (invoice.draftBy) userIds.add(invoice.draftBy);
        if (invoice.confirmedBy) userIds.add(invoice.confirmedBy);

        let users: UserResponseDto[] = [];
        if (userIds.size > 0) {
            users = await this.invoiceHelperService.getUsersByIds(Array.from(userIds));
        }

        const draftByUsername = users.find(u => u.id === invoice.draftBy)?.username;
        const confirmedByUsername = users.find(u => u.id === invoice.confirmedBy)?.username;

        return this.importInvoicesMapper.toImportInvoiceResponseDto(
            invoice,
            draftByUsername,
            confirmedByUsername,
        );
    }

    // Map a list of invoices to response DTOs without products.
    private async mapToWithoutProductsDtoList(invoices: ImportInvoiceEntity[]): Promise<ImportInvoiceWithoutProductsDto[]> {
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

            return this.importInvoicesMapper.toImportInvoiceWithoutProductsDto(
                invoice,
                draftByUsername,
                confirmedByUsername
            );
        });
    }

    // --- APIs ---
    // Create a new draft import invoice.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_IMPORT_INVOICE_SERVICE)
    async createDraftImportInvoice(dto: CreateImportInvoiceRequestDto, user: AccessTokenPayload): Promise<ImportInvoiceResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > this._maxProductsPerImportInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_IMPORT_INVOICE_PRODUCTS, `Too many products in import invoice. Maximum is ${this._maxProductsPerImportInvoice}.`);

        // Check whether the productId exists and active.
        const productIds: string[] = dto.products.map(product => product.productId);
        const { success, notFound, notActive }: { success: boolean, notFound: string[], notActive: string[] } = await this.invoiceHelperService.checkProductIdExistsAndActive(productIds);
        if (!success) {
            if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
            if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);
        }

        // Save a draft invoice.
        const savedInvoice = await this.importInvoiceRepository.createDraftImportInvoice(dto, user);
        return await this.mapToResponseDto(savedInvoice);
    }

    // Edit a draft import invoice.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_IMPORT_INVOICE_SERVICE)
    async editDraftImportInvoice(dto: EditImportInvoiceRequestDto, user: AccessTokenPayload): Promise<ImportInvoiceResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > this._maxProductsPerImportInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_IMPORT_INVOICE_PRODUCTS, `Too many products in import invoice. Maximum is ${this._maxProductsPerImportInvoice}.`);

        // Get invoice by ID.
        const invoice: ImportInvoiceEntity = await this.getInvoiceById(dto.id);

        // Check if invoice is draft and user has permission to edit.
        if (invoice.status !== ImportInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Invoice is not in draft status.');
        if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to edit this invoice.');

        // Check whether the productId exists and active.
        const productIds: string[] = dto.products.map(product => product.productId);
        const { success, notFound, notActive }: { success: boolean, notFound: string[], notActive: string[] } = await this.invoiceHelperService.checkProductIdExistsAndActive(productIds);
        if (!success) {
            if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
            if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);
        }

        // Edit a draft invoice.
        const savedInvoice = await this.importInvoiceRepository.editDraftImportInvoice(dto, invoice, user);
        return await this.mapToResponseDto(savedInvoice);
    }

    // Delete draft import invoice.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_IMPORT_INVOICE_SERVICE)
    async deleteDraftImportInvoice(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        // Loop through IDs.
        for (const id of ids) {
            // Get invoice by ID.
            const invoice = await this.getInvoiceById(id);

            // Check if invoice is draft and user has permission to delete.
            if (invoice.status !== ImportInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Invoice is not in draft status.');
            if (invoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to delete this invoice.');
        }

        await this.importInvoiceRepository.deleteDraftImportInvoice(ids);
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
        const productIds: string[] = invoice.importInvoiceProducts.map(product => product.productId);
        const { success, notFound, notActive }: { success: boolean, notFound: string[], notActive: string[] } = await this.invoiceHelperService.checkProductIdExistsAndActive(productIds);
        if (!success) {
            if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
            if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);
        }

        // Confirm invoice.
        const confirmedInvoice = await this.importInvoiceRepository.confirmImportInvoice(invoice, user);
        if (!confirmedInvoice) throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.CONFIRM_IMPORT_INVOICE_SERVICE, 'Failed to confirm invoice.');

        return await this.mapToResponseDto(confirmedInvoice);
    }

    // Get import invoice by ID.
    @HandleServiceError(ErrorCode.GET_IMPORT_INVOICE_BY_ID_SERVICE)
    async getImportInvoiceById(id: string): Promise<ImportInvoiceResponseDto> {
        const invoice = await this.getInvoiceById(id);
        return await this.mapToResponseDto(invoice);
    }

    // Get list of import invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_IMPORT_INVOICES_SERVICE)
    async getListOfImportInvoices(dto: GetListOfImportInvoiceRequestDto, user: AccessTokenPayload): Promise<GetListOfImportInvoicesResponseDto> {
        const { data, total } = await this.importInvoiceRepository.getListOfImportInvoices(dto, user);
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: await this.mapToWithoutProductsDtoList(data),
        };
    }
}
