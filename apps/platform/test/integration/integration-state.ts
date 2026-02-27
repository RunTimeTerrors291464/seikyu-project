/**
 * Shared mutable state across integration spec files.
 *
 * Works because Jest runs with --runInBand (single process).
 * Node.js module cache ensures the same object instance is shared
 * across all spec files.
 *
 * Usage:
 *   import { integrationState } from './integration-state';
 *
 *   // In 01-users spec -> write
 *   integrationState.adminUserId = result.id;
 *
 *   // In 02-products spec -> read
 *   const adminId = integrationState.adminUserId;
 */
export const integrationState: {
    // Users
    adminUserId: string | null;
    cashierUserId: string | null;
    managerUserId: string | null;
} = {
    adminUserId: null,
    cashierUserId: null,
    managerUserId: null,
};
