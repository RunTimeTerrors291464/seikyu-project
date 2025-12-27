"use client";
import DataTable, { Column } from "@/components/ui/DataTable";
import IconCircleButton from "@/components/ui/IconCircleButton";
import RuleInput from "@/components/ui/RuleInput";
import AddInvoiceModal from "@/components/invoices/AddInvoiceModal";
import { Braces, ChevronLeft, ChevronRight, Clock, Filter, GitCommit, Hash, MessageSquare, Receipt, RotateCcw, SquareCheck, User, UserIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type SalesInvoice = {
  id: string;     // renamed from "invoice number"
  status: "Draft" | "Pending" | "Completed" | "Cancelled";
  createdBy: string;         // renamed from "create by"
  createdAt: string;         // ISO date, renamed from "create date"
  note?: string;             // optional
  inputInRE: boolean;        // whether input in RE
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
    id: "25-00001",
    status: "Completed",
    createdBy: "Alex Johnson",
    createdAt: "2025-11-10 09:15:20",
    note: "Paid via bank transfer.",
    inputInRE: true,
  },
  {
    id: "25-00002",
    status: "Pending",
    createdBy: "Sarah Kim",
    createdAt: "2025-11-11 14:02:10",
    note: "Awaiting confirmation.",
    inputInRE: true,
  },
  {
    id: "25-00003",
    status: "Draft",
    createdBy: "David Nguyen",
    createdAt: "2025-11-12 16:40:00",
    inputInRE: false,
  },
  {
    id: "25-00004",
    status: "Cancelled",
    createdBy: "Maria Gomez",
    createdAt: "2025-11-12 18:20:55",
    note: "Customer cancelled order.",
    inputInRE: false,
  },
  {
    id: "25-00005",
    status: "Pending",
    createdBy: "Emily Carter",
    createdAt: "2025-11-13 08:12:40",
    note: "Customer requested revised quote.",
    inputInRE: false,
  },
  {
    id: "25-00006",
    status: "Completed",
    createdBy: "Daniel Lee",
    createdAt: "2025-11-13 09:33:10",
    inputInRE: true,
  },
  {
    id: "25-00007",
    status: "Draft",
    createdBy: "Michael Chen",
    createdAt: "2025-11-13 10:21:55",
    inputInRE: false,
  },
  {
    id: "25-00008",
    status: "Cancelled",
    createdBy: "Anna Smith",
    createdAt: "2025-11-13 11:04:23",
    note: "Incorrect customer information.",
    inputInRE: false,
  },
  {
    id: "25-00009",
    status: "Pending",
    createdBy: "Jacob Wilson",
    createdAt: "2025-11-13 11:45:12",
    inputInRE: false,
  },
  {
    id: "25-00010",
    status: "Completed",
    createdBy: "Sophia Martinez",
    createdAt: "2025-11-13 12:10:40",
    note: "Paid via e-wallet.",
    inputInRE: true,
  },
  {
    id: "25-00011",
    status: "Draft",
    createdBy: "Chris Adams",
    createdAt: "2025-11-13 12:58:22",
    inputInRE: false,
  },
  {
    id: "25-00012",
    status: "Completed",
    createdBy: "Olivia Brown",
    createdAt: "2025-11-13 13:22:14",
    inputInRE: true,
  },
  {
    id: "25-00013",
    status: "Pending",
    createdBy: "Ryan Miller",
    createdAt: "2025-11-13 14:01:09",
    note: "Payment via COD.",
    inputInRE: false,
  },
  {
    id: "25-00014",
    status: "Cancelled",
    createdBy: "Laura Davis",
    createdAt: "2025-11-13 14:40:33",
    inputInRE: false,
  },
  {
    id: "25-00015",
    status: "Draft",
    createdBy: "Peter Johnson",
    createdAt: "2025-11-13 15:18:50",
    inputInRE: false,
  },
  {
    id: "25-00016",
    status: "Completed",
    createdBy: "Emily Carter",
    createdAt: "2025-11-13 16:05:12",
    inputInRE: true,
  },
  {
    id: "25-00017",
    status: "Pending",
    createdBy: "Daniel Lee",
    createdAt: "2025-11-13 16:42:59",
    note: "Requires approval.",
    inputInRE: false,
  },
  {
    id: "25-00018",
    status: "Completed",
    createdBy: "Michael Chen",
    createdAt: "2025-11-13 17:20:40",
    inputInRE: true,
  },
  {
    id: "25-00019",
    status: "Cancelled",
    createdBy: "Anna Smith",
    createdAt: "2025-11-13 17:59:33",
    note: "Duplicate order.",
    inputInRE: false,
  },
  {
    id: "25-00020",
    status: "Pending",
    createdBy: "Jacob Wilson",
    createdAt: "2025-11-13 18:33:21",
    inputInRE: false,
  },
  {
    id: "25-00021",
    status: "Draft",
    createdBy: "Sophia Martinez",
    createdAt: "2025-11-13 19:02:18",
    note: "Waiting for product pricing.",
    inputInRE: false,
  },
  {
    id: "25-00022",
    status: "Completed",
    createdBy: "Chris Adams",
    createdAt: "2025-11-13 19:40:55",
    inputInRE: true,
  },
  {
    id: "25-00023",
    status: "Pending",
    createdBy: "Olivia Brown",
    createdAt: "2025-11-13 20:11:42",
    inputInRE: false,
  },
  {
    id: "25-00024",
    status: "Completed",
    createdBy: "Ryan Miller",
    createdAt: "2025-11-13 20:55:30",
    note: "Delivered successfully.",
    inputInRE: true,
  },
];

const columns: Column<SalesInvoice>[] = [
  {
    id: "invoiceNumber",
    header: "Invoice No.",
    icon: <Hash className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
    accessor: (r) => (
      <Link
        href={`/invoices/${r.id}`}
        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
      >
        {r.id}
      </Link>
    ),
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
    id: "inputInRE",
    header: "Input in RE",
    icon: <SquareCheck className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
    thClassName: "w-[140px]",
    accessor: (r) => (
      <input
        type="checkbox"
        checked={r.inputInRE}
        readOnly
        className="h-4 w-4 rounded border-neutral-300 text-blue-600 pointer-events-none dark:border-neutral-600 dark:bg-neutral-800"
      />
    ),
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
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const totalPages = Math.ceil(rows.length / rowsPerPage);

  // Slice data for current page
  const pageRows = rows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const options = [10, 20, 50, 100];

  return (
    <div className="flex min-h-0 grow flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sales Invoices</h1>
        <RuleInput
          options={[
            { label: "Invoice No.", icon: <Hash className="h-3 w-3" /> },
            { label: "Created By", icon: <User className="h-3 w-3" /> },
            { label: "Status", icon: <Braces className="h-3 w-3" /> },
          ]}
          placeholder="Type to search…"
          onChange={({ rule, value }) => console.log(rule, value)}
        />

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

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-md bg-neutral-900 px-3 py-2 text-xs text-white dark:bg-white dark:text-neutral-900"
          >
            + Add Sales Invoice
          </button>
        </div>
      </div>

      {/* Add Invoice Modal */}
      <AddInvoiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(data) => {
          console.log("Invoice saved:", data);
          // TODO: Handle save logic
        }}
      />

      {/* DataTable */}
      <div className="min-h-0 grow rounded-lg border bg-white shadow-sm dark:bg-neutral-900">
        <DataTable<SalesInvoice>
          columns={columns}
          data={pageRows}
          getRowId={(r) => r.id}
          maxHeight="fill"
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
