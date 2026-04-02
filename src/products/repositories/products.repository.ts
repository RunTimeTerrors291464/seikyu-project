import { Injectable } from '@nestjs/common';
import { EntityManager, Repository, In, SelectQueryBuilder } from 'typeorm';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { ProductsEntity } from '../entities/products.entity';
import { ProductNamesEntity } from '../entities/productNames.entity';
import { ProductsHistoryEntity } from '../entities/productsHistory.entity';
import { ProductStockHistoryEntity } from '../entities/productStockHistory.entity';
import { ProductOverviewEntity } from '../entities/productOverview.entity';

// 
