import Link from "next/link";

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Invoice {id}</h1>
        <div className="flex gap-2">
          <button className="h-9 rounded-md border px-3 text-sm">Return Note</button>
          <button className="h-9 rounded-md border px-3 text-sm">Cancel</button>
          <Link className="h-9 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900" href={`/invoices/${id}/edit`}>
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border bg-white p-4 dark:bg-neutral-900">
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div><span className="text-neutral-500">Status</span><div className="mt-1 font-medium">Return</div></div>
              <div><span className="text-neutral-500">Return against</span><div className="mt-1"><Link href="/invoices/25-00003" className="text-blue-600 underline">25-00003</Link></div></div>
              <div><span className="text-neutral-500">Date & Posting Time</span><div className="mt-1">2025-10-15 01:22:33.678</div></div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Sub Total</span><span>$ 99,998</span></div>
              <div className="flex justify-between"><span>Discount (AT)</span><span>10%</span></div>
              <div className="mt-2 border-t pt-2 text-lg font-semibold flex justify-between"><span>Total</span><span>$ 99,999</span></div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm text-neutral-500">Note</label>
              <textarea className="min-h-24 w-full rounded-md border bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:bg-neutral-900" defaultValue="Bla Bla Bla" />
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-lg border bg-white p-2 dark:bg-neutral-900">
            <div className="aspect-[3/4] w-full rounded-md bg-neutral-50 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
