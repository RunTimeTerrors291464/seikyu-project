import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Import entities.
import { SellingInvoiceEntity } from '../entities/sellingInvoices.entity';

// Import repositories.
import { SellingInvoiceRepository, ResolvedSellingProductData } from '../repositories/sellingInvoice.repository';

// Import services.
import { ProductsService } from '@src/products/services/products.service';

// Import DTOs.
import {
    CreateSellingInvoiceRequestDto,
    GetListOfSellingInvoiceRequestDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudSellingInvoicesRequest.dto';
import {
    SellingInvoiceResponseDto,
    GetListOfSellingInvoicesResponseDto,
} from '@libs/common/dtos/invoices/sellingInvoices/crudSellingInvoicesResponse.dto';
import { ProductResponseDto } from '@libs/common/dtos/products/crudProductResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import mappers.
import { SellingInvoicesMapper } from '@libs/common/mappers/sellingInvoices.mapper';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

@Injectable()
export class SellingInvoiceService {
    constructor(
        private readonly sellingInvoiceRepository: SellingInvoiceRepository,
        private readonly sellingInvoicesMapper: SellingInvoicesMapper,

        private readonly productsService: ProductsService,
        private readonly dataSource: DataSource,
    ) { }

    // --- Private variables ---
    private static readonly _maxProductsPerSellingInvoice = 64;

    // --- DRY methods ---
    // Calculate invoice totals from products.
    private calculateInvoiceTotals(
        products: CreateSellingInvoiceRequestDto['products'],
        productDetails: ProductResponseDto[],
        invoiceDiscountPercent: number,
    ): {
        totalProducts: number;
        totalQuantity: number;
        totalSellingPrice: number;
        invoiceDiscount: number;
        resolvedProducts: ResolvedSellingProductData[];
    } {
        const totalProducts = new Set(products.map((product) => product.productSku)).size;
        let totalQuantity = 0;
        let totalSellingPrice = 0;

        const productMap = new Map(productDetails.map((p) => [p.sku, p] as const));

        const resolveDiscountRate = (productDiscount: number | null | undefined): number =>
            productDiscount != null && productDiscount > 0 ? productDiscount : invoiceDiscountPercent;

        const resolvedProducts: ResolvedSellingProductData[] = [];

        products.forEach((product) => {
            totalQuantity += product.quantity;
            const detail = productMap.get(product.productSku);
            const unitPrice = product.sellingPrice;
            const appliedDiscount = resolveDiscountRate(product.productDiscount);
            const subtotal = product.quantity * unitPrice;
            const totalProductPrice = subtotal * (1 - appliedDiscount / 100);
            totalSellingPrice += totalProductPrice;

            resolvedProducts.push({
                productId: detail?.id ?? '',
                productSku: detail?.sku ?? product.productSku,
                productName: detail?.productNames?.[0] ?? product.productName,
                productUnit: detail?.productUnitName ?? product.productUnit,
                quantity: product.quantity,
                sellingPrice: unitPrice,
                appliedDiscount,
                totalProductPrice,
                notes: product.notes ?? null,
            });
        });

        return {
            totalProducts,
            totalQuantity,
            totalSellingPrice,
            invoiceDiscount: invoiceDiscountPercent,
            resolvedProducts,
        };
    }

    // Get an invoice by ID.
    private async getInvoiceById(id: string): Promise<SellingInvoiceEntity> {
        const invoice = await this.sellingInvoiceRepository.getSellingInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.SELLING_INVOICE_NOT_FOUND, `Selling invoice with ID ${id} not found`);
        return invoice;
    }

    // --- Public methods ---
    // Create a new selling invoice.
    @HandleServiceError(ErrorCode.CREATE_SELLING_INVOICE_SERVICE)
    async createSellingInvoice(dto: CreateSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<SellingInvoiceResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > SellingInvoiceService._maxProductsPerSellingInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_SELLING_INVOICE_PRODUCTS, `Too many products in selling invoice. Maximum is ${SellingInvoiceService._maxProductsPerSellingInvoice}.`);

        // Check whether the product SKU exists and active.
        const productSkus = dto.products.map((p) => p.productSku);
        const productDetails = await this.productsService.getProductsBySkus(productSkus);

        // Calculate invoice totals.
        const invoiceDiscountPercent = dto.invoiceDiscount ?? 0;
        const calculatedTotals = this.calculateInvoiceTotals(dto.products, productDetails, invoiceDiscountPercent);

        // Save the invoice.
        const savedInvoice = await this.dataSource.transaction((manager) =>
            this.sellingInvoiceRepository.createSellingInvoice(dto, user, calculatedTotals, manager),
        );
        return this.sellingInvoicesMapper.toSellingInvoiceResponseDto(savedInvoice);
    }

    // Get selling invoice by ID.
    @HandleServiceError(ErrorCode.GET_SELLING_INVOICE_BY_ID_SERVICE)
    async getSellingInvoiceById(id: string): Promise<SellingInvoiceResponseDto> {
        const invoice = await this.getInvoiceById(id);
        return this.sellingInvoicesMapper.toSellingInvoiceResponseDto(invoice);
    }

    // Get list of selling invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_SELLING_INVOICES_SERVICE)
    async getListOfSellingInvoices(dto: GetListOfSellingInvoiceRequestDto): Promise<GetListOfSellingInvoicesResponseDto> {
        const { data, total } = await this.sellingInvoiceRepository.getListOfSellingInvoices(dto);

        // Map the invoices to the response DTO.
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: data.map((invoice) => this.sellingInvoicesMapper.toSellingInvoiceWithoutProductsDto(invoice)),
        };
    }
}
