export default function NewInvoicePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add Sales Invoice</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-white p-4 dark:bg-neutral-900">
            <div className="mb-2 text-sm font-medium">Customer</div>
            <input className="h-9 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:bg-neutral-900" />
          </div>
          <div className="rounded-lg border bg-white p-4 dark:bg-neutral-900">
            <div className="mb-2 text-sm font-medium">Line Items</div>
            <div className="h-64 rounded-md bg-neutral-50 dark:bg-neutral-800" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 dark:bg-neutral-900">
            <div className="mb-2 text-sm font-medium">Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Sub Total</span><span>$0.00</span></div>
              <div className="flex justify-between"><span>Discount</span><span>$0.00</span></div>
              <div className="mt-2 border-t pt-2 text-base font-semibold flex justify-between"><span>TOTAL</span><span>$0.00</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="h-9 rounded-md border px-3 text-sm">Cancel</button>
              <button className="h-9 rounded-md bg-neutral-900 px-3 text-sm text-white dark:bg-white dark:text-neutral-900">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
