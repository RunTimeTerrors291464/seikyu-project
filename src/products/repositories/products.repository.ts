import { Injectable } from '@nestjs/common';
import { EntityManager, Repository, In, SelectQueryBuilder } from 'typeorm';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { ProductsEntity } from '../entities/products.entity';
import { ProductNamesEntity } from '../entities/productNames.entity';
import { ProductsHistoryEntity } from '../entities/productsHistory.entity';
import { ProductStockHistoryEntity } from '../entities/productStockHistory.entity';
import { ProductOverviewEntity } from '../entities/productOverview.entity';

// Import DTOs.
import {
    CreateProductRequestDto,
    EditProductRequestDto,
    GetListOfProductRequestDto,
    GetListOfProductByProductUnitIdRequestDto,
} from '@libs/common/dtos/products/crudProductRequest.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import enums.
import { StockStatus } from '@libs/common/enums/stockStatus.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';

@Injectable()
export class ProductsRepository {
}