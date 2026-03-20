export enum StockActionType {
    ADD = 'add',
    SUBTRACT = 'subtract',
}

export enum StockActionReason {
    // Subtract reasons
    DAMAGED_GOODS = 'damagedGoods',
    EXPIRED_GOODS = 'expiredGoods',
    LOST_GOODS = 'lostGoods',
    THEFT = 'theft',
    SAMPLE_USAGE = 'sampleUsage',
    INTERNAL_USE = 'internalUse',

    // Add reasons
    FOUND_GOODS = 'foundGoods',
    SUPPLIER_BONUS = 'supplierBonus',
    RETURNED_GOODS = 'returnedGoods',

    // General
    PERIODIC_INVENTORY_CHECK = 'periodicInventoryCheck',
    OTHER = 'other',
}
