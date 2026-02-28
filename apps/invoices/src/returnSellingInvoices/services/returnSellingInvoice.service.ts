import { HttpStatus, Injectable } from '@nestjs/common';

// Import repositories.
import { ReturnSellingInvoiceRepository, ResolvedReturnSellingProductData } from '../repositories/returnSellingInvoice.repository';
import { SellingInvoiceRepository } from '../../sellingInvoices/repositories/sellingInvoices.repository';

// Import DTOs.
import {
    CreateReturnSellingInvoiceRequestDto,
    EditReturnSellingInvoiceRequestDto,
    ReturnSellingInvoiceProductRequestDto,
    GetListOfReturnSellingInvoiceRequestDto
} from '@app/common/dtos/invoices/returnSellingInvoices/crudReturnSellingInvoicesRequest.dto';
import {
    ReturnSellingInvoiceResponseDto,
    GetListOfReturnSellingInvoicesResponseDto,
    ReturnSellingInvoiceWithoutProductsDto
} from '@app/common/dtos/invoices/returnSellingInvoices/crudReturnSellingInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import mappers.
import { ReturnSellingInvoicesMapper } from '@app/common/mappers/invoices/returnSellingInvoices.mapper';

// Import helper service.
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Import entities.
import { ReturnSellingInvoiceEntity } from '../entities/returnSellingInvoices.entity';
import { SellingInvoiceEntity } from '../../sellingInvoices/entities/sellingInvoices.entity';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';
import { ReturnSellingInvoiceStatus, SellingInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

@Injectable()
export class ReturnSellingInvoiceService {
    constructor(
        private readonly returnSellingInvoiceRepository: ReturnSellingInvoiceRepository,
        private readonly sellingInvoicesRepository: SellingInvoiceRepository,
        private readonly invoiceHelperService: InvoiceHelperService,
        private readonly returnSellingInvoicesMapper: ReturnSellingInvoicesMapper,
    ) { }

    // --- Constants ---
    private readonly _maxProductsPerReturnSellingInvoice = 64;

    // --- DRY methods ---
    // Calculate invoice totals from resolved return products.
    private calculateInvoiceTotals(resolvedProducts: ResolvedReturnSellingProductData[]) {
        let totalProducts = resolvedProducts.length;
        let totalQuantity = 0;
        let totalReturnPrice = 0;

        resolvedProducts.forEach(item => {
            totalQuantity += item.returnQuantity;
            totalReturnPrice += item.returnQuantity * item.sellingInvoiceProduct.sellingPrice;
        });

        return { totalProducts, totalQuantity, totalReturnPrice };
    }

    // Validate products to check if they are valid for return.
    private async checkProductInSellingInvoice(
        productsToReturn: ReturnSellingInvoiceProductRequestDto[],
        sellingInvoice: SellingInvoiceEntity
    ): Promise<ResolvedReturnSellingProductData[]> {
        const productIds = productsToReturn.map(p => p.productId);

        // 1. Check if products exist in database.
        const { notFound, notActive } = await this.invoiceHelperService.checkProductIdExistsAndActive(productIds);
        if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);

        // 2. Check if products are active.
        if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, `One or more products is not active`, notActive);

        // 3. Check if products exist in the original selling invoice.
        const notInInvoice: string[] = [];
        productsToReturn.forEach(item => {
            const productInInvoice = sellingInvoice.sellingInvoiceProducts?.find(p => p.productId === item.productId);
            if (!productInInvoice) notInInvoice.push(item.productId);
        });

        if (notInInvoice.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, `One or more products are not part of the original selling invoice`, notInInvoice);

        // 4. Check if return quantity exceeds returnable quantity.
        const quantityExceeded: string[] = [];
        const resolvedProducts: ResolvedReturnSellingProductData[] = [];

        productsToReturn.forEach(item => {
            const productInInvoice = sellingInvoice.sellingInvoiceProducts?.find(p => p.productId === item.productId);
            if (productInInvoice) {
                const returnableQuantity = productInInvoice.quantity - productInInvoice.returnQuantity;
                if (item.returnQuantity > returnableQuantity) {
                    quantityExceeded.push(item.productId);
                } else {
                    resolvedProducts.push({
                        sellingInvoiceProduct: productInInvoice,
                        returnQuantity: item.returnQuantity,
                        notes: item.notes ?? null,
                    });
                }
            }
        });
        if (quantityExceeded.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, `Return quantity exceeds returnable quantity for one or more products.`, quantityExceeded);

        return resolvedProducts;
    }

    // Get the selling invoice by id.
    private async getSellingInvoiceById(id: string): Promise<SellingInvoiceEntity> {
        const sellingInvoice = await this.sellingInvoicesRepository.getSellingInvoiceById(id);
        if (!sellingInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Original selling invoice with ID ${id} not found`);
        return sellingInvoice;
    }

    // Map an invoice to response DTO.
    private async mapToResponseDto(invoice: ReturnSellingInvoiceEntity): Promise<ReturnSellingInvoiceResponseDto> {
        const userIds = new Set<string>();
        if (invoice.draftBy) userIds.add(invoice.draftBy);
        if (invoice.confirmedBy) userIds.add(invoice.confirmedBy);

        let users: UserResponseDto[] = [];
        if (userIds.size > 0) {
            users = await this.invoiceHelperService.getUsersByIds(Array.from(userIds));
        }

        const draftByUsername = users.find(u => u.id === invoice.draftBy)?.username;
        const confirmedByUsername = users.find(u => u.id === invoice.confirmedBy)?.username;

        return this.returnSellingInvoicesMapper.toReturnSellingInvoiceResponseDto(
            invoice,
            draftByUsername,
            confirmedByUsername,
        );
    }

    // Map a list of invoices to response DTOs without products.
    private async mapToWithoutProductsDtoList(invoices: ReturnSellingInvoiceEntity[]): Promise<ReturnSellingInvoiceWithoutProductsDto[]> {
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

            return this.returnSellingInvoicesMapper.toReturnSellingInvoiceWithoutProductsDto(
                invoice,
                draftByUsername,
                confirmedByUsername
            );
        });
    }

    // --- APIs ---
    // Create a new draft return selling invoice.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_RETURN_SELLING_INVOICE_SERVICE)
    async createDraftReturnSellingInvoice(dto: CreateReturnSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > this._maxProductsPerReturnSellingInvoice) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_RETURN_SELLING_INVOICE_PRODUCTS, `Too many products in return selling invoice. Maximum is ${this._maxProductsPerReturnSellingInvoice}.`);
        }

        // Get the original selling invoice.
        const sellingInvoice: SellingInvoiceEntity = await this.getSellingInvoiceById(dto.sellingInvoiceId);

        // Check if the original selling invoice is in a valid status to be returned.
        if (sellingInvoice.status !== SellingInvoiceStatus.CONFIRMED && sellingInvoice.status !== SellingInvoiceStatus.PARTIALLY_RETURNED) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_CONFIRMED, `Selling invoice must be CONFIRMED or PARTIALLY_RETURNED to be returned.`);
        }

        // Validate products and resolve their details from the original invoice.
        const resolvedProducts: ResolvedReturnSellingProductData[] = await this.checkProductInSellingInvoice(dto.products, sellingInvoice);

        // Calculate invoice totals.
        const calculatedTotals = this.calculateInvoiceTotals(resolvedProducts);

        // Create the draft return invoice through the repository.
        const savedInvoice = await this.returnSellingInvoiceRepository.createDraftReturnSellingInvoice(
            sellingInvoice,
            resolvedProducts,
            calculatedTotals,
            dto.notes ?? null,
            user
        );

        // Map to response DTO.
        return await this.mapToResponseDto(savedInvoice);
    }

    // Edit a draft return selling invoice.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_RETURN_SELLING_INVOICE_SERVICE)
    async editDraftReturnSellingInvoice(dto: EditReturnSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > this._maxProductsPerReturnSellingInvoice) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_RETURN_SELLING_INVOICE_PRODUCTS, `Too many products in return selling invoice. Maximum is ${this._maxProductsPerReturnSellingInvoice}.`);
        }

        // Get the existing return selling invoice.
        const returnSellingInvoice = await this.returnSellingInvoiceRepository.getReturnSellingInvoiceById(dto.id);
        if (!returnSellingInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Return selling invoice with ID ${dto.id} not found`);

        // Check if the status is DRAFT.
        if (returnSellingInvoice.status !== ReturnSellingInvoiceStatus.DRAFT) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, `Return selling invoice must be DRAFT to be edited.`);
        }

        // Get the original selling invoice.
        const sellingInvoice: SellingInvoiceEntity = await this.getSellingInvoiceById(returnSellingInvoice.sellingInvoice.id);

        // Check if the original selling invoice is in a valid status to be returned.
        if (sellingInvoice.status !== SellingInvoiceStatus.CONFIRMED && sellingInvoice.status !== SellingInvoiceStatus.PARTIALLY_RETURNED) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_CONFIRMED, `Selling invoice status must be CONFIRMED or PARTIALLY_RETURNED to be returned.`);
        }

        // Validate products and resolve their details from the original invoice.
        const resolvedProducts: ResolvedReturnSellingProductData[] = await this.checkProductInSellingInvoice(dto.products, sellingInvoice);

        // Calculate invoice totals.
        const calculatedTotals = this.calculateInvoiceTotals(resolvedProducts);

        // Edit the draft return invoice through the repository.
        const savedInvoice = await this.returnSellingInvoiceRepository.editDraftReturnSellingInvoice(
            returnSellingInvoice,
            resolvedProducts,
            calculatedTotals,
            dto.notes ?? null,
            user
        );

        // Map to response DTO.
        return await this.mapToResponseDto(savedInvoice);
    }

    // Delete draft return selling invoices.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_RETURN_SELLING_INVOICE_SERVICE)
    async deleteDraftReturnSellingInvoice(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        // Loop through IDs.
        for (const id of ids) {
            // Get the existing return selling invoice.
            const returnSellingInvoice = await this.returnSellingInvoiceRepository.getReturnSellingInvoiceById(id);
            if (!returnSellingInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Return selling invoice with ID ${id} not found.`);

            // Check if invoice is draft and user has permission to delete.
            if (returnSellingInvoice.status !== ReturnSellingInvoiceStatus.DRAFT) {
                throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, `Return selling invoice must be DRAFT to be deleted.`);
            }
            if (returnSellingInvoice.draftBy !== user.id) {
                throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to delete this invoice.');
            }
        }

        // Delete the draft return invoice through the repository.
        await this.returnSellingInvoiceRepository.deleteDraftReturnSellingInvoice(ids);
        return true;
    }

    // Confirm a draft return selling invoice.
    @HandleServiceError(ErrorCode.CONFIRM_RETURN_SELLING_INVOICE_SERVICE)
    async confirmReturnSellingInvoice(id: string, user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {

        // Get the existing return selling invoice.
        const returnSellingInvoice = await this.returnSellingInvoiceRepository.getReturnSellingInvoiceById(id);
        if (!returnSellingInvoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Return selling invoice with ID ${id} not found.`);

        // Check if the status is DRAFT.
        if (returnSellingInvoice.status !== ReturnSellingInvoiceStatus.DRAFT) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, `Return selling invoice must be DRAFT to be confirmed.`);
        }

        // Check if user has permission.
        if (returnSellingInvoice.draftBy !== user.id) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to confirm this invoice.');
        }

        // Get the original selling invoice.
        const sellingInvoice: SellingInvoiceEntity = await this.getSellingInvoiceById(returnSellingInvoice.sellingInvoice.id);

        // Re-validate products against the current state of the original invoice.
        const productsToReturn = returnSellingInvoice.returnSellingInvoiceProducts.map(p => ({
            productId: p.productId,
            returnQuantity: p.returnQuantity,
            notes: p.notes || undefined
        }));
        await this.checkProductInSellingInvoice(productsToReturn, sellingInvoice);

        // Confirm the return invoice through the repository.
        const confirmedInvoice = await this.returnSellingInvoiceRepository.confirmReturnSellingInvoice(
            returnSellingInvoice,
            sellingInvoice,
            user
        );

        if (!confirmedInvoice) throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.CONFIRM_RETURN_SELLING_INVOICE_SERVICE, 'Failed to confirm return selling invoice.');

        // Map to response DTO.
        return await this.mapToResponseDto(confirmedInvoice);
    }

    // Get a return selling invoice by id.
    @HandleServiceError(ErrorCode.GET_RETURN_SELLING_INVOICE_BY_ID_SERVICE)
    async getReturnSellingInvoiceById(id: string): Promise<ReturnSellingInvoiceResponseDto> {
        const invoice = await this.returnSellingInvoiceRepository.getReturnSellingInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Return selling invoice with ID ${id} not found.`);
        return await this.mapToResponseDto(invoice);
    }

    // Get list of return selling invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_RETURN_SELLING_INVOICES_SERVICE)
    async getListOfReturnSellingInvoices(dto: GetListOfReturnSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<GetListOfReturnSellingInvoicesResponseDto> {
        const { data, total } = await this.returnSellingInvoiceRepository.getListOfReturnSellingInvoices(dto, user);
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: await this.mapToWithoutProductsDtoList(data),
        };
    }
}
