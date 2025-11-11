import IconCircleButton from "@/components/ui/IconCircleButton";
import { ChevronLeft, ChevronRight, Filter, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function InvoicesListPage() {
  // Mock options for table controls
  let rowsPerPage = 10;
  const options = [20, 50, 100, 500];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Sales Invoices</h1>
          <input
            placeholder="Search by Invoice Number, Customer…"
            className="h-8 w-80 rounded-md border bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-neutral-200 dark:bg-neutral-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-2 text-xs shadow-sm dark:bg-neutral-900">
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <span>Filter</span>
          </button>

          <IconCircleButton aria-label="Open detailed view">
            <RotateCcw className="h-4 w-4" />
          </IconCircleButton>
          
          <Link
          href="/invoices/new"
          className="rounded-md bg-neutral-900 px-3 py-2 text-xs text-white dark:bg-white dark:text-neutral-900"
          >
            + Add Sales Invoice
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
        <div className="h-64 rounded-md bg-neutral-50 dark:bg-neutral-800" />
      </div>

      <div className="flex items-center gap-3 mt-3">
        {/* ----- Page Navigation Pill ----- */}
        <div className="relative inline-flex items-stretch">
          <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
            {/* Prev button */}
            <button
              type="button"
              //onClick={() => setPage((p) => Math.max(1, p - 1))}
              //disabled={page <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-neutral-500" />
              {/* <span>Prev</span> */}
            </button>

            {/* Divider */}
            <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />
            {/* Page n of m */}
            <span className="inline-flex items-center px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800">
              Page 1 of 10
            </span>
            {/* Divider */}
            <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />

            {/* Next button */}
            <button
              type="button"
              //onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              //disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {/* <span>Next</span> */}
              <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* ----- Rows per Page Pill (inline options) ----- */}
        <div className="relative inline-flex items-stretch">
          <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
            {/* Divider */}
            <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />

            {/* Options (20, 50, 100, 500) */}
            {options.map((num, idx) => (
              <button
                key={num}
                type="button"
                //onClick={() => setRowsPerPage(num)}
                className={`inline-flex items-center px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800 ${
                  rowsPerPage === num
                    ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                    : ""
                } ${idx !== options.length - 1 ? "border-r border-neutral-200 dark:border-neutral-800" : ""}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
