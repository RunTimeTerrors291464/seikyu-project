import { HttpStatus, Injectable } from '@nestjs/common';

// Import repositories.
import { ReturnImportInvoiceRepository, ResolvedReturnProductData } from '../repositories/returnImportInvoice.repository';
import { ImportInvoiceRepository } from '../../importInvoices/repositories/importInvoice.repository';

// Import DTOs.
import {
    CreateReturnImportInvoiceRequestDto,
    EditReturnImportInvoiceRequestDto,
    ReturnImportInvoiceProductRequestDto,
    GetListOfReturnImportInvoiceRequestDto
} from '@app/common/dtos/invoices/returnImportInvoices/crudReturnImportInvoicesRequest.dto';
import {
    ReturnImportInvoiceResponseDto,
    GetListOfReturnImportInvoicesResponseDto,
    ReturnImportInvoiceWithoutProductsDto
} from '@app/common/dtos/invoices/returnImportInvoices/crudReturnImportInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import mappers.
import { ReturnImportInvoicesMapper } from '@app/common/mappers/invoices/returnImportInvoices.mapper';

// Import helper service.
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Import entities.
import { ReturnImportInvoiceEntity } from '../entities/returnImportInvoices.entity';
import { ImportInvoiceEntity } from '../../importInvoices/entities/importInvoices.entity';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';
import { ImportInvoiceStatus, ReturnImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Injectable()
export class ReturnImportInvoiceService {
    constructor(
        private readonly returnImportInvoiceRepository: ReturnImportInvoiceRepository,
        private readonly importInvoiceRepository: ImportInvoiceRepository,
        private readonly invoiceHelperService: InvoiceHelperService,
        private readonly returnImportInvoicesMapper: ReturnImportInvoicesMapper,
    ) { }

    // --- Constants ---
    private readonly _maxProductsPerReturnImportInvoice = 64;

    // --- DRY methods ---
    // Validate products to check if they are valid for return.
    private async checkProductInImportInvoice(
        productsToReturn: ReturnImportInvoiceProductRequestDto[],
        importInvoice: ImportInvoiceEntity
    ): Promise<ResolvedReturnProductData[]> {
        const productIds = productsToReturn.map(p => p.productId);

        // 1. Check if products exist in database.
        const { success, notFound, notActive } = await this.invoiceHelperService.checkProductIdExistsAndActive(productIds);
        if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);

        // 2. Check if products are active.
        if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, `One or more products is not active`, notActive);

        // 3. Check if products exist in the original import invoice.
        const notInInvoice: string[] = [];
        productsToReturn.forEach(item => {
            const productInInvoice = importInvoice.importInvoiceProducts?.find(p => p.productId === item.productId);
            if (!productInInvoice) notInInvoice.push(item.productId);
        });

        if (notInInvoice.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, `One or more products are not part of the original import invoice`, notInInvoice);

        // 4. Check if return quantity exceeds returnable quantity.
        const quantityExceeded: string[] = [];
        const resolvedProducts: ResolvedReturnProductData[] = [];

        productsToReturn.forEach(item => {
            const productInInvoice = importInvoice.importInvoiceProducts?.find(p => p.productId === item.productId);
            if (productInInvoice) {
                const returnableQuantity = productInInvoice.quantity - productInInvoice.returnedQuantity;
                if (item.returnQuantity > returnableQuantity) {
                    quantityExceeded.push(item.productId);
                } else {
                    resolvedProducts.push({
                        importInvoiceProduct: productInInvoice,
                        returnQuantity: item.returnQuantity,
                        notes: item.notes ?? null,
                    });
                }
            }
        });
        if (quantityExceeded.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, `Return quantity exceeds returnable quantity for one or more products.`, quantityExceeded);

        return resolvedProducts;
    }

    // Get the import invoice by id.
    private async getImportInvoiceById(id: string): Promise<ImportInvoiceEntity> {
        const importInvoice = await this.importInvoiceRepository.getImportInvoiceById(id);
        if (!importInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Original import invoice with ID ${id} not found`);
        return importInvoice;
    }

    // Map an invoice to response DTO.
    private async mapToResponseDto(invoice: ReturnImportInvoiceEntity): Promise<ReturnImportInvoiceResponseDto> {
        const userIds = new Set<string>();
        if (invoice.draftBy) userIds.add(invoice.draftBy);
        if (invoice.confirmedBy) userIds.add(invoice.confirmedBy);

        let users: UserResponseDto[] = [];
        if (userIds.size > 0) {
            users = await this.invoiceHelperService.getUsersByIds(Array.from(userIds));
        }

        const draftByUsername = users.find(u => u.id === invoice.draftBy)?.username;
        const confirmedByUsername = users.find(u => u.id === invoice.confirmedBy)?.username;

        return this.returnImportInvoicesMapper.toReturnImportInvoiceResponseDto(
            invoice,
            draftByUsername,
            confirmedByUsername,
        );
    }

    // Map a list of invoices to response DTOs without products.
    private async mapToWithoutProductsDtoList(invoices: ReturnImportInvoiceEntity[]): Promise<ReturnImportInvoiceWithoutProductsDto[]> {
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

            return this.returnImportInvoicesMapper.toReturnImportInvoiceWithoutProductsDto(
                invoice,
                draftByUsername,
                confirmedByUsername
            );
        });
    }

    // --- APIs ---
    // Create a new draft return import invoice.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_RETURN_IMPORT_INVOICE_SERVICE)
    async createDraftReturnImportInvoice(dto: CreateReturnImportInvoiceRequestDto, user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > this._maxProductsPerReturnImportInvoice) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_RETURN_IMPORT_INVOICE_PRODUCTS, `Too many products in return import invoice. Maximum is ${this._maxProductsPerReturnImportInvoice}.`);
        }

        // Get the original import invoice.
        const importInvoice: ImportInvoiceEntity = await this.getImportInvoiceById(dto.importInvoiceId);

        // Check if the original import invoice is in a valid status to be returned.
        if (importInvoice.status !== ImportInvoiceStatus.CONFIRMED && importInvoice.status !== ImportInvoiceStatus.PARTIALLY_RETURNED) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_CONFIRMED, `Import Invoice must be CONFIRMED or PARTIALLY_RETURNED to be returned.`);
        }

        // Validate products and resolve their details from the original invoice.
        const resolvedProducts: ResolvedReturnProductData[] = await this.checkProductInImportInvoice(dto.products, importInvoice);

        // Create the draft return invoice through the repository
        const savedInvoice = await this.returnImportInvoiceRepository.createDraftReturnImportInvoice(
            importInvoice,
            resolvedProducts,
            dto.notes ?? null,
            user
        );

        // Map to response DTO.
        return await this.mapToResponseDto(savedInvoice);
    }

    // Edit a draft return import invoice.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_RETURN_IMPORT_INVOICE_SERVICE)
    async editDraftReturnImportInvoice(dto: EditReturnImportInvoiceRequestDto, user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > this._maxProductsPerReturnImportInvoice) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_RETURN_IMPORT_INVOICE_PRODUCTS, `Too many products in return import invoice. Maximum is ${this._maxProductsPerReturnImportInvoice}.`);
        }

        // Get the existing return import invoice.
        const returnImportInvoice = await this.returnImportInvoiceRepository.getReturnImportInvoiceById(dto.id);
        if (!returnImportInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Return import invoice with ID ${dto.id} not found`);

        // Check if the status is DRAFT.
        if (returnImportInvoice.status !== ReturnImportInvoiceStatus.DRAFT) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, `Return import invoice must be DRAFT to be edited.`);
        }

        // Get the original import invoice
        const importInvoice: ImportInvoiceEntity = await this.getImportInvoiceById(returnImportInvoice.importInvoice.id);

        // Check if the original import invoice is in a valid status to be returned
        if (importInvoice.status !== ImportInvoiceStatus.CONFIRMED && importInvoice.status !== ImportInvoiceStatus.PARTIALLY_RETURNED) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_CONFIRMED, `Import invoice status must be CONFIRMED or PARTIALLY_RETURNED to be returned.`);
        }

        // Validate products and resolve their details from the original invoice.
        const resolvedProducts: ResolvedReturnProductData[] = await this.checkProductInImportInvoice(dto.products, importInvoice);

        // Edit the draft return invoice through the repository
        const savedInvoice = await this.returnImportInvoiceRepository.editDraftReturnImportInvoice(
            returnImportInvoice,
            resolvedProducts,
            dto.notes ?? null,
            user
        );

        // Map to response DTO.
        return await this.mapToResponseDto(savedInvoice);
    }

    // Delete draft return import invoices.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_RETURN_IMPORT_INVOICE_SERVICE)
    async deleteDraftReturnImportInvoice(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        // Loop through IDs.
        for (const id of ids) {
            // Get the existing return import invoice.
            const returnImportInvoice = await this.returnImportInvoiceRepository.getReturnImportInvoiceById(id);
            if (!returnImportInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Return import invoice with ID ${id} not found.`);

            // Check if invoice is draft and user has permission to delete.
            if (returnImportInvoice.status !== ReturnImportInvoiceStatus.DRAFT) {
                throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, `Return import invoice must be DRAFT to be deleted.`);
            }
            if (returnImportInvoice.draftBy !== user.id) {
                throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to delete this invoice.');
            }
        }

        // Delete the draft return invoice through the repository.
        await this.returnImportInvoiceRepository.deleteDraftReturnImportInvoice(ids);
        return true;
    }

    // Confirm a draft return import invoice.
    @HandleServiceError(ErrorCode.CONFIRM_RETURN_IMPORT_INVOICE_SERVICE)
    async confirmReturnImportInvoice(id: string, user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {

        // Get the existing return import invoice.
        const returnImportInvoice = await this.returnImportInvoiceRepository.getReturnImportInvoiceById(id);
        if (!returnImportInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Return import invoice with ID ${id} not found.`);

        // Check if the status is DRAFT.
        if (returnImportInvoice.status !== ReturnImportInvoiceStatus.DRAFT) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, `Return import invoice must be DRAFT to be confirmed.`);
        }

        // Check if user has permission.
        if (returnImportInvoice.draftBy !== user.id) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to confirm this invoice.');
        }

        // Get the original import invoice
        const importInvoice: ImportInvoiceEntity = await this.getImportInvoiceById(returnImportInvoice.importInvoice.id);

        // Re-validate products against the current state of the original invoice
        const productsToReturn = returnImportInvoice.returnImportInvoiceProducts.map(p => ({
            productId: p.productId,
            returnQuantity: p.returnQuantity,
            notes: p.notes || undefined
        }));
        await this.checkProductInImportInvoice(productsToReturn, importInvoice);

        // Confirm the return invoice through the repository
        const confirmedInvoice = await this.returnImportInvoiceRepository.confirmReturnImportInvoice(
            returnImportInvoice,
            importInvoice,
            user
        );

        if (!confirmedInvoice) throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.CONFIRM_RETURN_IMPORT_INVOICE_SERVICE, 'Failed to confirm return import invoice.');

        // Map to response DTO.
        return await this.mapToResponseDto(confirmedInvoice);
    }

    // Get a return import invoice by id.
    @HandleServiceError(ErrorCode.GET_RETURN_IMPORT_INVOICE_BY_ID_SERVICE)
    async getReturnImportInvoiceById(id: string): Promise<ReturnImportInvoiceResponseDto> {
        const invoice = await this.returnImportInvoiceRepository.getReturnImportInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Return import invoice with ID ${id} not found.`);
        return await this.mapToResponseDto(invoice);
    }

    // Get list of return import invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_RETURN_IMPORT_INVOICES_SERVICE)
    async getListOfReturnImportInvoices(dto: GetListOfReturnImportInvoiceRequestDto, user: AccessTokenPayload): Promise<GetListOfReturnImportInvoicesResponseDto> {
        const { data, total } = await this.returnImportInvoiceRepository.getListOfReturnImportInvoices(dto, user);
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: await this.mapToWithoutProductsDtoList(data),
        };
    }

}
