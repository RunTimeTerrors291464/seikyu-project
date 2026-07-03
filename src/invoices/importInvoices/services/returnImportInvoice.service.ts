import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Import entities.
import { ImportInvoiceEntity } from '../entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from '../entities/importInvocieProducts.entity';
import { ReturnImportInvoiceProductsEntity } from '../entities/returnImportInvoiceProducts.entity';

// Import repositories.
import { ImportInvoiceRepository } from '../repositories/importInvoice.repository';
import { ResolvedReturnProductData, ReturnImportInvoiceRepository } from '../repositories/returnImportInvoice.repository';

// Import services.
import { ProductsService } from '@src/products/services/products.service';

// Import DTOs.
import {
    CreateReturnImportInvoiceRequestDto,
    EditReturnImportInvoiceRequestDto,
    GetListOfReturnImportInvoiceRequestDto,
    ReturnImportInvoiceProductRequestDto,
} from '@libs/common/dtos/invoices/importInvoices/crudReturnImportInvoicesRequest.dto';
import {
    GetListOfReturnImportInvoicesResponseDto,
    ReturnImportInvoiceResponseDto,
} from '@libs/common/dtos/invoices/importInvoices/crudReturnImportInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import mappers.
import { ImportInvoicesMapper } from '@libs/common/mappers/importInvoices.mapper';

// Import enums.
import { ImportInvoiceStatus, ReturnImportInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

@Injectable()
export class ReturnImportInvoiceService {
    constructor(
        private readonly returnImportInvoiceRepository: ReturnImportInvoiceRepository,
        private readonly importInvoiceRepository: ImportInvoiceRepository,
        private readonly importInvoicesMapper: ImportInvoicesMapper,

        private readonly productsService: ProductsService,
        private readonly dataSource: DataSource,
    ) { }

    // --- DRY methods ---
    // Calculate invoice totals from resolved return products.
    private calculateInvoiceTotals(resolvedProducts: ResolvedReturnProductData[]) {
        const totalProducts = new Set(resolvedProducts.map((item) => item.importInvoiceProduct.productId)).size;
        let totalQuantity = 0;
        let totalReturnPrice = 0;

        resolvedProducts.forEach((item) => {
            totalQuantity += item.returnQuantity;
            totalReturnPrice += item.returnQuantity * Number(item.importInvoiceProduct.importPrice);
        });

        return { totalProducts, totalQuantity, totalReturnPrice };
    }

    private mergeReturnRequestsByProductId(productsToReturn: ReturnImportInvoiceProductRequestDto[]): ReturnImportInvoiceProductRequestDto[] {
        const byProductId = new Map<string, ReturnImportInvoiceProductRequestDto>();

        productsToReturn.forEach((item) => {
            const existing = byProductId.get(item.productId);
            if (!existing) {
                byProductId.set(item.productId, { ...item });
                return;
            }

            existing.returnQuantity += item.returnQuantity;
            if (!existing.reasonNotes && item.reasonNotes) existing.reasonNotes = item.reasonNotes;
        });

        return [...byProductId.values()];
    }

    // Validate products to check if they are valid for return.
    private async checkProductInImportInvoice(
        productsToReturn: ReturnImportInvoiceProductRequestDto[],
        importInvoice: ImportInvoiceEntity,
    ): Promise<ResolvedReturnProductData[]> {
        const productIds = productsToReturn.map((p) => p.productId);
        const uniqueProductIds = [...new Set(productIds)];

        // 1. Check if products exist in the database.
        // 2. Check if products are active (getProductsByIds throws PRODUCT_NOT_FOUND / PRODUCT_NOT_ACTIVE).
        if (uniqueProductIds.length > 0) await this.productsService.getProductsByIds(uniqueProductIds);

        const importLines = importInvoice.importInvoiceProducts ?? [];
        const mergedProductsToReturn = this.mergeReturnRequestsByProductId(productsToReturn);

        // 3. Check if products exist on the original import invoice.
        const linesByProductId = new Map<string, ImportInvoiceProductsEntity[]>();
        importLines.forEach((line) => {
            const lines = linesByProductId.get(line.productId) ?? [];
            lines.push(line);
            linesByProductId.set(line.productId, lines);
        });

        const notInInvoice: string[] = [];
        mergedProductsToReturn.forEach((item) => {
            if (!linesByProductId.has(item.productId)) notInInvoice.push(item.productId);
        });
        if (notInInvoice.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, 'One or more products are not part of the original import invoice.', { productIds: notInInvoice });

        // 4. Check return quantity vs returnable.
        const quantityExceeded: string[] = [];
        mergedProductsToReturn.forEach((item) => {
            const matchingLines = linesByProductId.get(item.productId) ?? [];
            const returnableQuantity = matchingLines.reduce((sum, line) => sum + (line.quantity - line.returnedQuantity), 0);
            if (item.returnQuantity > returnableQuantity) quantityExceeded.push(item.productId);
        });

        if (quantityExceeded.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, 'Return quantity exceeds returnable quantity for one or more products.', { productIds: quantityExceeded });

        const resolvedProducts: ResolvedReturnProductData[] = [];
        mergedProductsToReturn.forEach((item) => {
            let remainingQuantity = item.returnQuantity;
            const matchingLines = linesByProductId.get(item.productId) ?? [];

            for (const productInInvoice of matchingLines) {
                if (remainingQuantity <= 0) break;

                const returnableQuantity = productInInvoice.quantity - productInInvoice.returnedQuantity;
                const returnQuantity = Math.min(remainingQuantity, returnableQuantity);
                if (returnQuantity <= 0) continue;

                resolvedProducts.push({
                    importInvoiceProduct: productInInvoice,
                    returnQuantity,
                    reasonCategory: item.reasonCategory,
                    reasonNotes: item.reasonNotes ?? null,
                });

                remainingQuantity -= returnQuantity;
            }
        });

        return resolvedProducts;
    }

    private async checkReturnImportLinesStillReturnable(
        returnLines: ReturnImportInvoiceProductsEntity[],
        importInvoice: ImportInvoiceEntity,
    ): Promise<void> {
        const productIds = [...new Set(returnLines.map((line) => line.productId))];
        if (productIds.length > 0) await this.productsService.getProductsByIds(productIds);

        const requestedQtyByImportLineId = new Map<string, number>();
        const sourceLineById = new Map<string, ImportInvoiceProductsEntity>();

        returnLines.forEach((line) => {
            const sourceLine = line.importInvoiceProduct;
            if (!sourceLine || sourceLine.importInvoiceId !== importInvoice.id) {
                throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, 'One or more products are not part of the original import invoice.', { productIds: [line.productId] });
            }

            sourceLineById.set(sourceLine.id, sourceLine);
            requestedQtyByImportLineId.set(sourceLine.id, (requestedQtyByImportLineId.get(sourceLine.id) ?? 0) + line.returnQuantity);
        });

        const quantityExceeded: string[] = [];
        requestedQtyByImportLineId.forEach((returnQuantity, importLineId) => {
            const sourceLine = sourceLineById.get(importLineId);
            if (!sourceLine) return;

            const returnableQuantity = sourceLine.quantity - sourceLine.returnedQuantity;
            if (returnQuantity > returnableQuantity) quantityExceeded.push(sourceLine.productId);
        });

        if (quantityExceeded.length > 0) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, 'Return quantity exceeds returnable quantity for one or more products.', { productIds: [...new Set(quantityExceeded)] });
        }
    }

    // Get the original import invoice by id.
    private async getImportInvoiceById(id: string): Promise<ImportInvoiceEntity> {
        const invoice = await this.importInvoiceRepository.getImportInvoiceById(id);
        if (!invoice) {
            throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.IMPORT_INVOICE_NOT_FOUND, `Import invoice with ID ${id} not found`);
        }
        return invoice;
    }

    // Get a return import invoice by id.
    private async getReturnImportInvoiceByIdOrThrow(id: string) {
        const invoice = await this.returnImportInvoiceRepository.getReturnImportInvoiceById(id);
        if (!invoice) {
            throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.RETURN_IMPORT_INVOICE_NOT_FOUND, `Return import invoice with ID ${id} not found`);
        }
        return invoice;
    }

    // --- Public methods ---
    // Create a new draft return import invoice.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_RETURN_IMPORT_INVOICE_SERVICE)
    async createDraftReturnImportInvoice(dto: CreateReturnImportInvoiceRequestDto, user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {

        // Get the original import invoice by id.
        const importInvoice = await this.getImportInvoiceById(dto.importInvoiceId);

        // Check if the import invoice is confirmed or partially returned.
        if (importInvoice.status !== ImportInvoiceStatus.CONFIRMED && importInvoice.status !== ImportInvoiceStatus.PARTIALLY_RETURNED) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.IMPORT_INVOICE_NOT_RETURNABLE, 'Import invoice must be CONFIRMED or PARTIALLY_RETURNED to create a return.');
        }

        // Check if the products are valid for return.
        const resolvedProducts = await this.checkProductInImportInvoice(dto.products, importInvoice);
        const calculatedTotals = this.calculateInvoiceTotals(resolvedProducts);

        // Create the return import invoice.
        const savedInvoice = await this.dataSource.transaction((manager) =>
            this.returnImportInvoiceRepository.createDraftReturnImportInvoice(
                importInvoice,
                resolvedProducts,
                calculatedTotals,
                dto.notes ?? null,
                user,
                manager,
            ),
        );

        return this.importInvoicesMapper.toReturnImportInvoiceResponseDto(savedInvoice);
    }

    // Edit a draft return import invoice.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_RETURN_IMPORT_INVOICE_SERVICE)
    async editDraftReturnImportInvoice(dto: EditReturnImportInvoiceRequestDto, user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {

        // Get the return import invoice by id.
        const returnImportInvoice = await this.getReturnImportInvoiceByIdOrThrow(dto.id);

        // Check if the return import invoice is in draft status.
        if (returnImportInvoice.status !== ReturnImportInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Return import invoice is not in draft status.');
        if (returnImportInvoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to edit this invoice.');

        // Get the original import invoice by id.
        const importInvoice = await this.getImportInvoiceById(returnImportInvoice.importInvoiceId);

        // Check if the import invoice is confirmed or partially returned.
        if (importInvoice.status !== ImportInvoiceStatus.CONFIRMED && importInvoice.status !== ImportInvoiceStatus.PARTIALLY_RETURNED) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.IMPORT_INVOICE_NOT_RETURNABLE, 'Import invoice must be CONFIRMED or PARTIALLY_RETURNED to edit this return.');

        // Check if the products are valid for return.
        const resolvedProducts = await this.checkProductInImportInvoice(dto.products, importInvoice);
        const calculatedTotals = this.calculateInvoiceTotals(resolvedProducts);

        // Edit the return import invoice.
        const savedInvoice = await this.dataSource.transaction((manager) =>
            this.returnImportInvoiceRepository.editDraftReturnImportInvoice(
                returnImportInvoice,
                resolvedProducts,
                calculatedTotals,
                dto.notes ?? null,
                user,
                manager,
            ),
        );

        return this.importInvoicesMapper.toReturnImportInvoiceResponseDto(savedInvoice);
    }

    // Delete draft return import invoices.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_RETURN_IMPORT_INVOICE_SERVICE)
    async deleteDraftReturnImportInvoice(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        for (const id of ids) {
            const returnImportInvoice = await this.getReturnImportInvoiceByIdOrThrow(id);

            if (returnImportInvoice.status !== ReturnImportInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Return import invoice is not in draft status.');
            if (returnImportInvoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to delete this invoice.');
        }

        await this.dataSource.transaction((manager) => this.returnImportInvoiceRepository.deleteDraftReturnImportInvoice(ids, manager));
        return true;
    }

    // Confirm a draft return import invoice.
    @HandleServiceError(ErrorCode.CONFIRM_RETURN_IMPORT_INVOICE_SERVICE)
    async confirmReturnImportInvoice(id: string, user: AccessTokenPayload): Promise<ReturnImportInvoiceResponseDto> {

        // Get the return import invoice by id.
        const returnImportInvoice = await this.getReturnImportInvoiceByIdOrThrow(id);

        // Check if the return import invoice is in draft status.
        if (returnImportInvoice.status !== ReturnImportInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Return import invoice is not in draft status.');

        // Get the original import invoice by id.
        const importInvoice = await this.getImportInvoiceById(returnImportInvoice.importInvoiceId);

        // Check if the products are valid for return.
        const lines = returnImportInvoice.returnImportInvoiceProducts ?? [];
        await this.checkReturnImportLinesStillReturnable(lines, importInvoice);

        // Confirm the return import invoice.
        const confirmedInvoice = await this.dataSource.transaction((manager) =>
            this.returnImportInvoiceRepository.confirmReturnImportInvoice(returnImportInvoice, importInvoice, user, manager),
        );

        // Check if the return import invoice was confirmed.
        if (!confirmedInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Return import invoice could not be confirmed.');

        return this.importInvoicesMapper.toReturnImportInvoiceResponseDto(confirmedInvoice);
    }

    // Get return import invoice by ID.
    @HandleServiceError(ErrorCode.GET_RETURN_IMPORT_INVOICE_BY_ID_SERVICE)
    async getReturnImportInvoiceById(id: string): Promise<ReturnImportInvoiceResponseDto> {
        const invoice = await this.getReturnImportInvoiceByIdOrThrow(id);
        return this.importInvoicesMapper.toReturnImportInvoiceResponseDto(invoice);
    }

    // Get list of return import invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_RETURN_IMPORT_INVOICES_SERVICE)
    async getListOfReturnImportInvoices(dto: GetListOfReturnImportInvoiceRequestDto): Promise<GetListOfReturnImportInvoicesResponseDto> {
        const { data, total } = await this.returnImportInvoiceRepository.getListOfReturnImportInvoices(dto);

        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: data.map((invoice) => this.importInvoicesMapper.toReturnImportInvoiceWithoutProductsDto(invoice)),
        };
    }
}
