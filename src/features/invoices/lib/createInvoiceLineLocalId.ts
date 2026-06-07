let invoiceLineLocalIdCounter = 0;

export function createInvoiceLineLocalId(seed: string): string {
  invoiceLineLocalIdCounter += 1;

  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) {
    return `${seed}-${randomUuid}`;
  }

  return `${seed}-${Date.now()}-${invoiceLineLocalIdCounter}`;
}
