import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Import entities.
import { SellingInvoiceEntity } from '../entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from '../entities/sellingInvoiceProducts.entity';
import { ReturnSellingInvoiceProductsEntity } from '../entities/returnSellingInvoiceProducts.entity';

// Import repositories.
import { SellingInvoiceRepository } from '../repositories/sellingInvoice.repository';
import { ResolvedReturnSellingProductData, ReturnSellingInvoiceRepository } from '../repositories/returnSellingInvoice.repository';

// Import services.
import { ProductsService } from '@src/products/services/products.service';

// Import DTOs.
import {
    CreateReturnSellingInvoiceRequestDto,
    EditReturnSellingInvoiceRequestDto,
    GetListOfReturnSellingInvoiceRequestDto,
    ReturnSellingInvoiceProductRequestDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudReturnSellingInvoicesRequest.dto';
import {
    GetListOfReturnSellingInvoicesResponseDto,
    ReturnSellingInvoiceResponseDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudReturnSellingInvoicesResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import mappers.
import { SellingInvoicesMapper } from '@libs/common/mappers/sellingInvoices.mapper';

// Import enums.
import { ReturnSellingInvoiceStatus, SellingInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

@Injectable()
export class ReturnSellingInvoiceService {
    constructor(
        private readonly returnSellingInvoiceRepository: ReturnSellingInvoiceRepository,
        private readonly sellingInvoiceRepository: SellingInvoiceRepository,
        private readonly sellingInvoicesMapper: SellingInvoicesMapper,

        private readonly productsService: ProductsService,
        private readonly dataSource: DataSource,
    ) { }

    // --- DRY methods ---
    // Calculate invoice totals from resolved return products.
    private calculateInvoiceTotals(resolvedProducts: ResolvedReturnSellingProductData[]) {
        const totalProducts = new Set(resolvedProducts.map((item) => item.sellingInvoiceProduct.productId)).size;
        let totalQuantity = 0;
        let totalReturnPrice = 0;

        resolvedProducts.forEach((item) => {
            totalQuantity += item.returnQuantity;
            totalReturnPrice += item.returnQuantity * Number(item.sellingInvoiceProduct.sellingPrice);
        });

        return { totalProducts, totalQuantity, totalReturnPrice };
    }

    private mergeReturnRequestsByProductId(
        productsToReturn: ReturnSellingInvoiceProductRequestDto[],
    ): ReturnSellingInvoiceProductRequestDto[] {
        const byProductId = new Map<string, ReturnSellingInvoiceProductRequestDto>();

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
    private async checkProductInSellingInvoice(
        productsToReturn: ReturnSellingInvoiceProductRequestDto[],
        sellingInvoice: SellingInvoiceEntity,
    ): Promise<ResolvedReturnSellingProductData[]> {
        const productIds = productsToReturn.map((p) => p.productId);
        const uniqueProductIds = [...new Set(productIds)];

        // 1. Check if products exist in the database.
        // 2. Check if products are active (getProductsByIds throws PRODUCT_NOT_FOUND / PRODUCT_NOT_ACTIVE).
        if (uniqueProductIds.length > 0) await this.productsService.getProductsByIds(uniqueProductIds);

        const sellingLines = sellingInvoice.sellingInvoiceProducts ?? [];
        const mergedProductsToReturn = this.mergeReturnRequestsByProductId(productsToReturn);

        // 3. Check if products exist on the original selling invoice.
        const linesByProductId = new Map<string, SellingInvoiceProductsEntity[]>();
        sellingLines.forEach((line) => {
            const lines = linesByProductId.get(line.productId) ?? [];
            lines.push(line);
            linesByProductId.set(line.productId, lines);
        });

        const notInInvoice: string[] = [];
        mergedProductsToReturn.forEach((item) => {
            if (!linesByProductId.has(item.productId)) notInInvoice.push(item.productId);
        });
        if (notInInvoice.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, 'One or more products are not part of the original selling invoice.', { productIds: notInInvoice });

        // 4. Check return quantity vs returnable.
        const quantityExceeded: string[] = [];
        mergedProductsToReturn.forEach((item) => {
            const matchingLines = linesByProductId.get(item.productId) ?? [];
            const returnableQuantity = matchingLines.reduce((sum, line) => sum + (line.quantity - line.returnQuantity), 0);
            if (item.returnQuantity > returnableQuantity) quantityExceeded.push(item.productId);
        });

        if (quantityExceeded.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, 'Return quantity exceeds returnable quantity for one or more products.', { productIds: quantityExceeded });

        const resolvedProducts: ResolvedReturnSellingProductData[] = [];
        mergedProductsToReturn.forEach((item) => {
            let remainingQuantity = item.returnQuantity;
            const matchingLines = linesByProductId.get(item.productId) ?? [];

            for (const productInInvoice of matchingLines) {
                if (remainingQuantity <= 0) break;

                const returnableQuantity = productInInvoice.quantity - productInInvoice.returnQuantity;
                const returnQuantity = Math.min(remainingQuantity, returnableQuantity);
                if (returnQuantity <= 0) continue;

                resolvedProducts.push({
                    sellingInvoiceProduct: productInInvoice,
                    returnQuantity,
                    reasonCategory: item.reasonCategory,
                    reasonNotes: item.reasonNotes ?? null,
                });

                remainingQuantity -= returnQuantity;
            }
        });

        return resolvedProducts;
    }

    private async checkReturnSellingLinesStillReturnable(
        returnLines: ReturnSellingInvoiceProductsEntity[],
        sellingInvoice: SellingInvoiceEntity,
    ): Promise<void> {
        const productIds = [...new Set(returnLines.map((line) => line.productId))];
        if (productIds.length > 0) await this.productsService.getProductsByIds(productIds);

        const requestedQtyBySellingLineId = new Map<string, number>();
        const sourceLineById = new Map<string, SellingInvoiceProductsEntity>();

        returnLines.forEach((line) => {
            const sourceLine = line.sellingInvoiceProduct;
            if (!sourceLine || sourceLine.sellingInvoiceId !== sellingInvoice.id) {
                throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, 'One or more products are not part of the original selling invoice.', { productIds: [line.productId] });
            }

            sourceLineById.set(sourceLine.id, sourceLine);
            requestedQtyBySellingLineId.set(sourceLine.id, (requestedQtyBySellingLineId.get(sourceLine.id) ?? 0) + line.returnQuantity);
        });

        const quantityExceeded: string[] = [];
        requestedQtyBySellingLineId.forEach((returnQuantity, sellingLineId) => {
            const sourceLine = sourceLineById.get(sellingLineId);
            if (!sourceLine) return;

            const returnableQuantity = sourceLine.quantity - sourceLine.returnQuantity;
            if (returnQuantity > returnableQuantity) quantityExceeded.push(sourceLine.productId);
        });

        if (quantityExceeded.length > 0) {
            throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.DTO_VALIDATION_ERROR, 'Return quantity exceeds returnable quantity for one or more products.', { productIds: [...new Set(quantityExceeded)] });
        }
    }

    // Get the original selling invoice by id.
    private async getSellingInvoiceById(id: string): Promise<SellingInvoiceEntity> {
        const invoice = await this.sellingInvoiceRepository.getSellingInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.SELLING_INVOICE_NOT_FOUND, `Selling invoice with ID ${id} not found`);
        return invoice;
    }

    // Get a return selling invoice by id.
    private async getReturnSellingInvoiceByIdOrThrow(id: string) {
        const invoice = await this.returnSellingInvoiceRepository.getReturnSellingInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.RETURN_SELLING_INVOICE_NOT_FOUND, `Return selling invoice with ID ${id} not found`);
        return invoice;
    }

    // --- Public methods ---
    // Create a new draft return selling invoice.
    @HandleServiceError(ErrorCode.CREATE_DRAFT_RETURN_SELLING_INVOICE_SERVICE)
    async createDraftReturnSellingInvoice(dto: CreateReturnSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {

        // Get the original selling invoice by id.
        const sellingInvoice = await this.getSellingInvoiceById(dto.sellingInvoiceId);

        // Check if the selling invoice is confirmed or partially returned.
        if (sellingInvoice.status !== SellingInvoiceStatus.CONFIRMED && sellingInvoice.status !== SellingInvoiceStatus.PARTIALLY_RETURNED) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.SELLING_INVOICE_NOT_RETURNABLE, 'Selling invoice must be CONFIRMED or PARTIALLY_RETURNED to create a return.');

        // Check if the products are valid for return.
        const resolvedProducts = await this.checkProductInSellingInvoice(dto.products, sellingInvoice);
        const calculatedTotals = this.calculateInvoiceTotals(resolvedProducts);

        // Create the return selling invoice.
        const savedInvoice = await this.dataSource.transaction((manager) =>
            this.returnSellingInvoiceRepository.createDraftReturnSellingInvoice(
                sellingInvoice,
                resolvedProducts,
                calculatedTotals,
                dto.notes ?? null,
                user,
                manager,
            ),
        );

        return this.sellingInvoicesMapper.toReturnSellingInvoiceResponseDto(savedInvoice);
    }

    // Edit a draft return selling invoice.
    @HandleServiceError(ErrorCode.EDIT_DRAFT_RETURN_SELLING_INVOICE_SERVICE)
    async editDraftReturnSellingInvoice(dto: EditReturnSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {

        // Get the return selling invoice by id.
        const returnSellingInvoice = await this.getReturnSellingInvoiceByIdOrThrow(dto.id);

        // Check if the return selling invoice is in draft status.
        if (returnSellingInvoice.status !== ReturnSellingInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Return selling invoice is not in draft status.');
        if (returnSellingInvoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to edit this invoice.');

        // Get the original selling invoice by id.
        const sellingInvoice = await this.getSellingInvoiceById(returnSellingInvoice.sellingInvoiceId);

        // Check if the selling invoice is confirmed or partially returned.
        if (sellingInvoice.status !== SellingInvoiceStatus.CONFIRMED && sellingInvoice.status !== SellingInvoiceStatus.PARTIALLY_RETURNED) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.SELLING_INVOICE_NOT_RETURNABLE, 'Selling invoice must be CONFIRMED or PARTIALLY_RETURNED to edit this return.');

        // Check if the products are valid for return.
        const resolvedProducts = await this.checkProductInSellingInvoice(dto.products, sellingInvoice);
        const calculatedTotals = this.calculateInvoiceTotals(resolvedProducts);

        // Edit the return selling invoice.
        const savedInvoice = await this.dataSource.transaction((manager) =>
            this.returnSellingInvoiceRepository.editDraftReturnSellingInvoice(
                returnSellingInvoice,
                resolvedProducts,
                calculatedTotals,
                dto.notes ?? null,
                user,
                manager,
            ),
        );

        return this.sellingInvoicesMapper.toReturnSellingInvoiceResponseDto(savedInvoice);
    }

    // Delete draft return selling invoices.
    @HandleServiceError(ErrorCode.DELETE_DRAFT_RETURN_SELLING_INVOICE_SERVICE)
    async deleteDraftReturnSellingInvoice(ids: string[], user: AccessTokenPayload): Promise<boolean> {

        // Loop through IDs.
        for (const id of ids) {
            const returnSellingInvoice = await this.getReturnSellingInvoiceByIdOrThrow(id);

            if (returnSellingInvoice.status !== ReturnSellingInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Return selling invoice is not in draft status.');
            if (returnSellingInvoice.draftBy !== user.id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NO_PERMISSION_DRAFT, 'User has no permission to delete this invoice.');
        }

        await this.dataSource.transaction((manager) => this.returnSellingInvoiceRepository.deleteDraftReturnSellingInvoice(ids, manager));
        return true;
    }

    // Confirm a draft return selling invoice.
    @HandleServiceError(ErrorCode.CONFIRM_RETURN_SELLING_INVOICE_SERVICE)
    async confirmReturnSellingInvoice(id: string, user: AccessTokenPayload): Promise<ReturnSellingInvoiceResponseDto> {

        // Get the return selling invoice by id.
        const returnSellingInvoice = await this.getReturnSellingInvoiceByIdOrThrow(id);

        // Check if the return selling invoice is in draft status.
        if (returnSellingInvoice.status !== ReturnSellingInvoiceStatus.DRAFT) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Return selling invoice is not in draft status.');

        // Get the original selling invoice by id.
        const sellingInvoice = await this.getSellingInvoiceById(returnSellingInvoice.sellingInvoiceId);

        // Check if the products are valid for return.
        const lines = returnSellingInvoice.returnSellingInvoiceProducts ?? [];
        await this.checkReturnSellingLinesStillReturnable(lines, sellingInvoice);

        // Confirm the return selling invoice.
        const confirmedInvoice = await this.dataSource.transaction((manager) =>
            this.returnSellingInvoiceRepository.confirmReturnSellingInvoice(returnSellingInvoice, sellingInvoice, user, manager),
        );

        if (!confirmedInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.INVOICE_NOT_DRAFT, 'Return selling invoice could not be confirmed.');

        return this.sellingInvoicesMapper.toReturnSellingInvoiceResponseDto(confirmedInvoice);
    }

    // Get return selling invoice by ID.
    @HandleServiceError(ErrorCode.GET_RETURN_SELLING_INVOICE_BY_ID_SERVICE)
    async getReturnSellingInvoiceById(id: string): Promise<ReturnSellingInvoiceResponseDto> {
        const invoice = await this.getReturnSellingInvoiceByIdOrThrow(id);
        return this.sellingInvoicesMapper.toReturnSellingInvoiceResponseDto(invoice);
    }

    // Get list of return selling invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_RETURN_SELLING_INVOICES_SERVICE)
    async getListOfReturnSellingInvoices(dto: GetListOfReturnSellingInvoiceRequestDto): Promise<GetListOfReturnSellingInvoicesResponseDto> {
        const { data, total } = await this.returnSellingInvoiceRepository.getListOfReturnSellingInvoices(dto);

        // Map the invoices to the response DTO.
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: data.map((invoice) => this.sellingInvoicesMapper.toReturnSellingInvoiceWithoutProductsDto(invoice)),
        };
    }
}
