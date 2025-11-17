"use client";
import DataTable, { Column } from "@/components/ui/DataTable";
import IconCircleButton from "@/components/ui/IconCircleButton";
import RuleInput from "@/components/ui/RuleInput";
import { Braces, ChevronLeft, ChevronRight, Clock, Filter, GitCommit, Hash, MessageSquare, Receipt, RotateCcw, User, UserIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type SalesInvoice = {
  id: string;                // UUID
  invoiceNumber: string;     // renamed from "invoice number"
  status: "Draft" | "Pending" | "Completed" | "Cancelled";
  createdBy: string;         // renamed from "create by"
  createdAt: string;         // ISO date, renamed from "create date"
  note?: string;             // optional
};

function truncateUuid(id: string) {
  return id.length > 6 ? id.slice(0, 4) + "…" + id.slice(-3) : id;
}

function StatusPill({ status }: { status: SalesInvoice["status"] }) {
  const tone =
    status === "Completed"
      ? { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" }
      : status === "Pending"
      ? { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" }
      : status === "Draft"
      ? { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" }
      : { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" }; // Cancelled

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tone.bg} ${tone.text}`}>
      {status}
    </span>
  );
}


const rows: SalesInvoice[] = [
  {
    id: "b1f4e8c3-9e3d-4b1c-92bd-1d8c112233ab",
    invoiceNumber: "INV-2025-0001",
    status: "Completed",
    createdBy: "Alex Johnson",
    createdAt: "2025-11-10 09:15:20",
    note: "Paid via bank transfer.",
  },
  {
    id: "9c3fd672-4d3a-4781-b8e4-1122aabbcc33",
    invoiceNumber: "INV-2025-0002",
    status: "Pending",
    createdBy: "Sarah Kim",
    createdAt: "2025-11-11 14:02:10",
    note: "Awaiting confirmation.",
  },
  {
    id: "33aab8cd-18c9-4d90-9ffd-ccbb11223344",
    invoiceNumber: "INV-2025-0003",
    status: "Draft",
    createdBy: "David Nguyen",
    createdAt: "2025-11-12 16:40:00",
  },
  {
    id: "ff22aabb-92cd-4e3d-a112-334455667788",
    invoiceNumber: "INV-2025-0004",
    status: "Cancelled",
    createdBy: "Maria Gomez",
    createdAt: "2025-11-12 18:20:55",
    note: "Customer cancelled order.",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc01",
    invoiceNumber: "INV-2025-0005",
    status: "Pending",
    createdBy: "Emily Carter",
    createdAt: "2025-11-13 08:12:40",
    note: "Customer requested revised quote.",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc02",
    invoiceNumber: "INV-2025-0006",
    status: "Completed",
    createdBy: "Daniel Lee",
    createdAt: "2025-11-13 09:33:10",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc03",
    invoiceNumber: "INV-2025-0007",
    status: "Draft",
    createdBy: "Michael Chen",
    createdAt: "2025-11-13 10:21:55",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc04",
    invoiceNumber: "INV-2025-0008",
    status: "Cancelled",
    createdBy: "Anna Smith",
    createdAt: "2025-11-13 11:04:23",
    note: "Incorrect customer information.",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc05",
    invoiceNumber: "INV-2025-0009",
    status: "Pending",
    createdBy: "Jacob Wilson",
    createdAt: "2025-11-13 11:45:12",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc06",
    invoiceNumber: "INV-2025-0010",
    status: "Completed",
    createdBy: "Sophia Martinez",
    createdAt: "2025-11-13 12:10:40",
    note: "Paid via e-wallet.",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc07",
    invoiceNumber: "INV-2025-0011",
    status: "Draft",
    createdBy: "Chris Adams",
    createdAt: "2025-11-13 12:58:22",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc08",
    invoiceNumber: "INV-2025-0012",
    status: "Completed",
    createdBy: "Olivia Brown",
    createdAt: "2025-11-13 13:22:14",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc09",
    invoiceNumber: "INV-2025-0013",
    status: "Pending",
    createdBy: "Ryan Miller",
    createdAt: "2025-11-13 14:01:09",
    note: "Payment via COD.",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc10",
    invoiceNumber: "INV-2025-0014",
    status: "Cancelled",
    createdBy: "Laura Davis",
    createdAt: "2025-11-13 14:40:33",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc11",
    invoiceNumber: "INV-2025-0015",
    status: "Draft",
    createdBy: "Peter Johnson",
    createdAt: "2025-11-13 15:18:50",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc12",
    invoiceNumber: "INV-2025-0016",
    status: "Completed",
    createdBy: "Emily Carter",
    createdAt: "2025-11-13 16:05:12",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc13",
    invoiceNumber: "INV-2025-0017",
    status: "Pending",
    createdBy: "Daniel Lee",
    createdAt: "2025-11-13 16:42:59",
    note: "Requires approval.",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc14",
    invoiceNumber: "INV-2025-0018",
    status: "Completed",
    createdBy: "Michael Chen",
    createdAt: "2025-11-13 17:20:40",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc15",
    invoiceNumber: "INV-2025-0019",
    status: "Cancelled",
    createdBy: "Anna Smith",
    createdAt: "2025-11-13 17:59:33",
    note: "Duplicate order.",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc16",
    invoiceNumber: "INV-2025-0020",
    status: "Pending",
    createdBy: "Jacob Wilson",
    createdAt: "2025-11-13 18:33:21",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc17",
    invoiceNumber: "INV-2025-0021",
    status: "Draft",
    createdBy: "Sophia Martinez",
    createdAt: "2025-11-13 19:02:18",
    note: "Waiting for product pricing.",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc18",
    invoiceNumber: "INV-2025-0022",
    status: "Completed",
    createdBy: "Chris Adams",
    createdAt: "2025-11-13 19:40:55",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc19",
    invoiceNumber: "INV-2025-0023",
    status: "Pending",
    createdBy: "Olivia Brown",
    createdAt: "2025-11-13 20:11:42",
  },
  {
    id: "aa11bb22-3344-5566-7788-9900aabbcc20",
    invoiceNumber: "INV-2025-0024",
    status: "Completed",
    createdBy: "Ryan Miller",
    createdAt: "2025-11-13 20:55:30",
    note: "Delivered successfully.",
  },
];

const columns: Column<SalesInvoice>[] = [
  {
    id: "uuid",
    header: "UUID",
    icon: <GitCommit className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
    accessor: (r) => <span className="font-mono text-[13px] text-neutral-700 dark:text-neutral-200">{truncateUuid(r.id)}</span>,
    thClassName: "w-[120px]",
  },
  {
    id: "invoiceNumber",
    header: "Invoice No.",
    icon: <Hash className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
    accessor: (r) => <span className="text-neutral-700 dark:text-neutral-200">{r.invoiceNumber}</span>,
    thClassName: "w-[140px]",
  },
  {
    id: "status",
    header: "Status",
    icon: <Braces className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
    accessor: (r) => <StatusPill status={r.status} />,
    thClassName: "w-[140px]",
  },
  {
    id: "createdBy",
    header: "Created By",
    icon: <UserIcon className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
    accessor: (r) => <span className="text-neutral-700 dark:text-neutral-200">{r.createdBy}</span>,
    thClassName: "w-[140px]",
  },
  {
    id: "createdAt",
    header: "Created Date",
    icon: <Clock className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
    accessor: (r) => <span className="tabular-nums text-neutral-700 dark:text-neutral-200">{r.createdAt}</span>,
    thClassName: "w-[160px]",
  },
  {
    id: "note",
    header: "Note",
    icon: <MessageSquare className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
    accessor: (r) => <span className="truncate text-neutral-700 dark:text-neutral-200">{r.note || "—"}</span>,
    tdClassName: "max-w-[320px]",
  },
];

export default function InvoicesListPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(rows.length / rowsPerPage);

  // Slice data for current page
  const pageRows = rows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const options = [10, 20, 50, 100, 500];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Sales Invoices</h1>
          <RuleInput
            options={[
              { label: "Invoice Number", icon: <Hash className="h-3 w-3" /> },
              { label: "Customer Name", icon: <User className="h-3 w-3" /> },
              { label: "Status", icon: <Braces className="h-3 w-3" /> },
            ]}
            placeholder="Type to search…"
            onChange={({ rule, value }) => console.log(rule, value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-2 text-xs shadow-sm dark:bg-neutral-900"
          >
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <span>Filter</span>
          </button>

          <IconCircleButton aria-label="Refresh">
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

      {/* DataTable */}
      <div className="rounded-lg border bg-white shadow-sm dark:bg-neutral-900">
        <DataTable<SalesInvoice>
          columns={columns}
          data={pageRows}
          getRowId={(r) => r.id}
        />
      </div>

      {/* Pagination + rows per page */}
      <div className="flex items-center gap-3 mt-3">
        {/* Page Navigation */}
        <div className="relative inline-flex items-stretch">
          <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
            
            {/* Prev */}
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-neutral-500" />
            </button>

            {/* Divider */}
            <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />

            {/* Page display */}
            <span className="inline-flex items-center px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300">
              Page {page} of {totalPages}
            </span>

            {/* Divider */}
            <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />

            {/* Next */}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Rows per Page */}
        <div className="relative inline-flex items-stretch">
          <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900 dark:border-neutral-700">

            {options.map((num, idx) => (
              <button
                key={num}
                onClick={() => {
                  setRowsPerPage(num);
                  setPage(1); // reset to first page
                }}
                className={`
                  inline-flex items-center px-2.5 py-1.5 
                  hover:bg-neutral-50 dark:hover:bg-neutral-800
                  ${rowsPerPage === num
                    ? "bg-neutral-200 dark:bg-neutral-800 font-semibold text-neutral-800 dark:text-neutral-200"
                    : "text-neutral-600 dark:text-neutral-300"
                  }
                  ${idx !== options.length - 1 ? "border-r border-neutral-200 dark:border-neutral-800" : ""}
                `}
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
