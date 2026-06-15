import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

import { UsersRepository } from '@src/users/repositories/users.repository';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';
import { CustomException } from '@libs/common/error-exceptions/customException';
import { Role } from '@libs/common/enums/role.enum';
import { UsersEntity } from '@src/users/entities/users.entity';

export const IMPORT_DIR = path.join(process.cwd(), 'import');
export const DEFAULT_IMPORT_BASENAME = 'product_import';
export const SUPPORTED_IMPORT_EXTENSIONS = ['.xlsx', '.xlsm', '.xls'] as const;
export const INT32_MAX = 2147483647;
export const INT32_MIN = -2147483648;

export function normalizeCell(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value).trim();
}

export function findColumnIndex(headers: unknown[], headerName: string): number {
    const index = headers.findIndex((header) => normalizeCell(header) === headerName);
    if (index === -1) {
        throw new Error(`Column "${headerName}" was not found in the sheet header row.`);
    }
    return index;
}

export function resolveDefaultImportFilePath(): string {
    for (const extension of SUPPORTED_IMPORT_EXTENSIONS) {
        const candidate = path.join(IMPORT_DIR, `${DEFAULT_IMPORT_BASENAME}${extension}`);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(
        `Import file not found. Place your Excel file at one of:\n` +
        SUPPORTED_IMPORT_EXTENSIONS
            .map((extension) => `  - ${path.join(IMPORT_DIR, `${DEFAULT_IMPORT_BASENAME}${extension}`)}`)
            .join('\n'),
    );
}

export function resolveImportFilePath(fileArg: string): string {
    if (!fileArg) {
        return resolveDefaultImportFilePath();
    }

    const resolvedPath = path.isAbsolute(fileArg)
        ? fileArg
        : path.join(process.cwd(), fileArg);

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Excel file not found: ${resolvedPath}`);
    }

    return resolvedPath;
}

export function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function buildAccessTokenPayload(user: UsersEntity): AccessTokenPayload {
    const roles: Role[] = [];
    if (user.isAdmin) roles.push(Role.ADMIN);
    if (user.isManager) roles.push(Role.MANAGER);
    if (user.isCashier) roles.push(Role.CASHIER);

    return {
        id: user.id,
        username: user.username,
        roles,
        refreshTokenId: 'import-script',
    };
}

export async function resolveDefaultImportUser(dataSource: DataSource): Promise<UsersEntity> {
    const usersRepository = dataSource.getRepository(UsersEntity);

    const admin = await usersRepository.findOne({
        where: { isAdmin: true, isActive: true },
        order: { createdAt: 'ASC' },
    });
    if (admin) {
        return admin;
    }

    const manager = await usersRepository.findOne({
        where: { isManager: true, isActive: true },
        order: { createdAt: 'ASC' },
    });
    if (manager) {
        return manager;
    }

    throw new Error(
        'No active ADMIN or MANAGER user found in the database. Create one first or pass --user.',
    );
}

export async function resolveImportUser(
    usersRepository: UsersRepository,
    dataSource: DataSource,
    userRef?: string,
): Promise<UsersEntity> {
    if (!userRef) {
        return resolveDefaultImportUser(dataSource);
    }

    const user = isUuid(userRef)
        ? await usersRepository.getUserById(userRef)
        : await usersRepository.getUserByUsername(userRef);

    if (!user) {
        throw new Error(`User "${userRef}" was not found.`);
    }

    if (!user.isActive) {
        throw new Error(`User "${user.username}" is inactive and cannot be used for import.`);
    }

    if (!user.isManager && !user.isAdmin) {
        throw new Error(`User "${user.username}" must have MANAGER or ADMIN role to import.`);
    }

    return user;
}

export function getCustomExceptionErrorCode(error: unknown): number | null {
    if (!(error instanceof CustomException)) {
        return null;
    }

    const response = error.getResponse();
    if (typeof response === 'object' && response !== null && 'errorCode' in response) {
        return Number((response as { errorCode: number }).errorCode);
    }

    return null;
}

export function padSku(rawSku: string): { ok: true; sku: string } | { ok: false; reason: string } {
    const trimmed = rawSku.trim();
    if (!trimmed) {
        return { ok: false, reason: 'SKU is empty.' };
    }

    if (trimmed.length > 13) {
        return { ok: false, reason: `SKU exceeds 13 characters: "${trimmed}".` };
    }

    return { ok: true, sku: trimmed.padStart(13, '0') };
}

export function parseImportQuantity(raw: unknown): { ok: true; quantity: number } | { ok: false; reason: string } {
    const text = normalizeCell(raw);
    if (!text) {
        return { ok: true, quantity: 0 };
    }

    const value = Number(text);
    if (!Number.isFinite(value)) {
        return { ok: false, reason: `Quantity is not a valid number: "${text}".` };
    }

    if (!Number.isInteger(value)) {
        return { ok: false, reason: `Quantity must be an integer: "${text}".` };
    }

    if (value < INT32_MIN || value > INT32_MAX) {
        return { ok: false, reason: `Quantity exceeds 4-byte integer range (${INT32_MIN} to ${INT32_MAX}): ${value}.` };
    }

    return { ok: true, quantity: value };
}

export function parsePrice(raw: unknown, fieldName: string): { ok: true; value: number } | { ok: false; reason: string } {
    const text = normalizeCell(raw);
    if (!text) {
        return { ok: false, reason: `${fieldName} is empty.` };
    }

    const value = Number(text);
    if (!Number.isFinite(value)) {
        return { ok: false, reason: `${fieldName} is not a valid number: "${text}".` };
    }

    if (value < 0 || value > INT32_MAX) {
        return { ok: false, reason: `${fieldName} must be between 0 and ${INT32_MAX}.` };
    }

    const decimalPart = text.includes('.') ? text.split('.')[1] : '';
    if (decimalPart.length > 2) {
        return { ok: false, reason: `${fieldName} must have at most 2 decimal places.` };
    }

    return { ok: true, value };
}

export function parseOptionalThreshold(raw: unknown): { ok: true; value?: number } | { ok: false; reason: string } {
    const text = normalizeCell(raw);
    if (!text) {
        return { ok: true, value: undefined };
    }

    const value = Number(text);
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
        return { ok: false, reason: `Reorder Threshold must be an integer: "${text}".` };
    }

    if (value < 0 || value > INT32_MAX) {
        return { ok: false, reason: `Reorder Threshold must be between 0 and ${INT32_MAX}.` };
    }

    return { ok: true, value };
}
