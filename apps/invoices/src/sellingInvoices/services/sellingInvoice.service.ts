import { HttpStatus, Injectable } from '@nestjs/common';

// Import repositories.
import { SellingInvoiceRepository } from '../repositories/sellingInvoices.repository';
import { InvoiceHelperService } from '../../invoiceHelper/invoiceHelper.service';

// Import DTOs.
import {
    CreateSellingInvoiceRequestDto,
    GetListOfSellingInvoiceRequestDto,
} from '@app/common/dtos/invoices/sellingInvoices/crudSellingInvoicesRequest.dto';
import {
    SellingInvoiceResponseDto,
    GetListOfSellingInvoicesResponseDto,
    SellingInvoiceWithoutProductsDto,
} from '@app/common/dtos/invoices/sellingInvoices/crudSellingInvoicesResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import entities.
import { SellingInvoiceEntity } from '../entities/sellingInvoices.entity';

// Import mappers.
import { SellingInvoicesMapper } from '@app/common/mappers/invoices/sellingInvoices.mapper';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@Injectable()
export class SellingInvoiceService {
    constructor(
        private readonly sellingInvoiceRepository: SellingInvoiceRepository,
        private readonly invoiceHelperService: InvoiceHelperService,
        private readonly sellingInvoicesMapper: SellingInvoicesMapper,
    ) { }

    // --- Constants ---
    private readonly _maxProductsPerSellingInvoice = 64;

    // --- DRY methods ---
    // Get an invoice by ID.
    private async getInvoiceById(id: string): Promise<SellingInvoiceEntity> {
        const invoice = await this.sellingInvoiceRepository.getSellingInvoiceById(id);
        if (!invoice) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.INVOICE_NOT_FOUND, `Invoice with ID ${id} not found`);
        return invoice;
    }
    
    // Map an invoice to response DTO.
    private async mapToResponseDto(invoice: SellingInvoiceEntity): Promise<SellingInvoiceResponseDto> {
        let confirmedByUsername: string | undefined;

        if (invoice.confirmedBy) {
            const users: UserResponseDto[] = await this.invoiceHelperService.getUsersByIds([invoice.confirmedBy]);
            confirmedByUsername = users.find(u => u.id === invoice.confirmedBy)?.username;
        }

        return this.sellingInvoicesMapper.toSellingInvoiceResponseDto(invoice, confirmedByUsername);
    }

    // Map a list of invoices to response DTOs without products.
    private async mapToWithoutProductsDtoList(invoices: SellingInvoiceEntity[]): Promise<SellingInvoiceWithoutProductsDto[]> {
        const userIds = new Set<string>();
        invoices.forEach(invoice => {
            if (invoice.confirmedBy) userIds.add(invoice.confirmedBy);
        });

        let users: UserResponseDto[] = [];
        if (userIds.size > 0) {
            users = await this.invoiceHelperService.getUsersByIds(Array.from(userIds));
        }

        return invoices.map(invoice => {
            const confirmedByUsername = users.find(u => u.id === invoice.confirmedBy)?.username;
            return this.sellingInvoicesMapper.toSellingInvoiceWithoutProductsDto(invoice, confirmedByUsername);
        });
    }

    // --- APIs ---
    // Create a new selling invoice.
    @HandleServiceError(ErrorCode.CREATE_SELLING_INVOICE_SERVICE)
    async createSellingInvoice(dto: CreateSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<SellingInvoiceResponseDto> {

        // Check if the number of products exceeds the limit.
        if (dto.products.length > this._maxProductsPerSellingInvoice) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.TOO_MANY_SELLING_INVOICE_PRODUCTS, `Too many products in selling invoice. Maximum is ${this._maxProductsPerSellingInvoice}.`);

        // Check whether all product SKUs exist and are active.
        const productSkus: string[] = dto.products.map(product => product.productSku);
        const { success, notFound, notActive }: { success: boolean, notFound: string[], notActive: string[] } =
            await this.invoiceHelperService.checkProductSkuExistsAndActive(productSkus);
        if (!success) {
            if (notFound.length > 0) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.PRODUCT_NOT_FOUND, `One or more products not found`, notFound);
            if (notActive.length > 0) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_NOT_ACTIVE, `One or more products is not active`, notActive);
        }

        // Create and confirm the selling invoice.
        const savedInvoice = await this.sellingInvoiceRepository.createSellingInvoice(dto, user);
        return await this.mapToResponseDto(savedInvoice);
    }

    // Get selling invoice by ID.
    @HandleServiceError(ErrorCode.GET_SELLING_INVOICE_BY_ID_SERVICE)
    async getSellingInvoiceById(id: string): Promise<SellingInvoiceResponseDto> {
        const invoice = await this.getInvoiceById(id);
        return await this.mapToResponseDto(invoice);
    }

    // Get list of selling invoices.
    @HandleServiceError(ErrorCode.GET_LIST_OF_SELLING_INVOICES_SERVICE)
    async getListOfSellingInvoices(dto: GetListOfSellingInvoiceRequestDto, user: AccessTokenPayload): Promise<GetListOfSellingInvoicesResponseDto> {
        const { data, total } = await this.sellingInvoiceRepository.getListOfSellingInvoices(dto, user);
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            invoices: await this.mapToWithoutProductsDtoList(data),
        };
    }
}
