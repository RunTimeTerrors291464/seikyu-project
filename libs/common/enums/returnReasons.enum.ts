export enum ReturnReason {

  // --- Product Issues ---
  DEFECTIVE = 'defective',
  DAMAGED_IN_TRANSIT = 'damagedInTransit',
  DAMAGED_ON_ARRIVAL = 'damagedOnArrival',
  EXPIRED = 'expired',
  QUALITY_ISSUE = 'qualityIssue',
  WRONG_SPECIFICATION = 'wrongSpecification',

  // --- Quantity Issues ---
  OVERSHIPPED = 'overShipped',
  UNDERSHIPPED = 'underShipped',
  DUPLICATE_SHIPMENT = 'duplicateShipment',

  // --- Documentation Issues ---
  WRONG_ITEM = 'wrongItem',
  INCORRECT_QUANTITY = 'incorrectQuantity',
  INVOICE_MISMATCH = 'invoiceMismatch',

  // --- Customer Requests ---
  CUSTOMER_REQUEST = 'customerRequest',
  NOT_AS_DESCRIBED = 'notAsDescribed',
  CHANGE_OF_MIND = 'changeOfMind',

  // --- Operational Issues ---
  WRONG_DESTINATION = 'wrongDestination',
  STOCK_ADJUSTMENT = 'stockAdjustment',
  INVENTORY_CORRECTION = 'inventoryCorrection',

  // --- Vendor/Supplier Issues ---
  VENDOR_QUALITY_ISSUE = 'vendorQualityIssue',
  VENDOR_RECALL = 'vendorRecall',

  // --- Other ---
  OTHER = 'other',
}

export enum StockAdjustmentReason {

  // --- Count & reconciliation ---
  CYCLE_COUNT_VARIANCE = 'cycleCountVariance',
  PHYSICAL_INVENTORY = 'physicalInventory',
  INVENTORY_CORRECTION = 'inventoryCorrection',

  // --- Loss, damage & expiry ---
  DAMAGE = 'damage',
  EXPIRED = 'expired',
  SHRINKAGE = 'shrinkage',
  OBSOLESCENCE = 'obsolescence',

  // --- Quality & compliance ---
  QUALITY_REJECTION = 'qualityRejection',
  RECALL = 'recall',

  // --- Operational variance ---
  RECEIVING_VARIANCE = 'receivingVariance',
  PICKING_ERROR = 'pickingError',
  SHIPPING_ERROR = 'shippingError',
  TRANSFER_VARIANCE = 'transferVariance',

  // --- Positive adjustments ---
  FOUND_INVENTORY = 'foundInventory',

  // --- System & data ---
  DATA_CORRECTION = 'dataCorrection',

  // --- Other ---
  OTHER = 'other',
}
