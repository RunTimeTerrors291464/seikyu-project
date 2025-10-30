import Link from "next/link";

export default function InvoicesListPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sales Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          + Add Sales Invoice
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
        <div className="mb-3 flex items-center gap-2">
          <input
            placeholder="Search by Invoice Number, Customer…"
            className="h-9 w-80 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:bg-neutral-900"
          />
          <button className="h-9 rounded-md border px-3 text-sm">Filter</button>
        </div>
        <div className="h-64 rounded-md bg-neutral-50 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
