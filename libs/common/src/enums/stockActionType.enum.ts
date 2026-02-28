export enum StockActionType {
    ADD = 'add',
    SUBTRACT = 'subtract',
}

export enum StockActionReason {
    // Subtract reasons
    DAMAGED_GOODS = 'damaged_goods',
    EXPIRED_GOODS = 'expired_goods',
    LOST_GOODS = 'lost_goods',
    THEFT = 'theft',
    SAMPLE_USAGE = 'sample_usage',
    INTERNAL_USE = 'internal_use',

    // Add reasons
    FOUND_GOODS = 'found_goods',
    SUPPLIER_BONUS = 'supplier_bonus',
    RETURNED_GOODS = 'returned_goods',

    // General
    PERIODIC_INVENTORY_CHECK = 'periodic_inventory_check',
    OTHER = 'other',
}