"use client";
import { Images, Filter, ExternalLink, Info, GitCommit, Clock as ClockIcon, MessageSquareText, Server, Tag as TagIcon, User as UserIcon } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import IconCircleButton from "@/components/ui/IconCircleButton";
import Tooltip from "@/components/ui/Tooltip";

export type SystemEvent = {
  id: string; // uuid
  timestamp: string; // ISO or formatted
  source: string; // keep field name for compatibility
  userName: string; // displayed in "Source" column per requirement
  tag: string; // e.g., Sales Invoice, Inbound Invoice, Inventory
  message: string;
};

function truncateUuid(id: string) {
  return id.length > 6 ? id.slice(0, 4) + "…" + id.slice(-3) : id;
}

function TagPill({ label }: { label: string }) {
  const tone =
    label.toLowerCase().includes("sales")
      ? { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400" }
      : label.toLowerCase().includes("inbound")
      ? { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" }
      : label.toLowerCase().includes("inventory")
      ? { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400" }
      : { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-700 dark:text-neutral-300" };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tone.bg} ${tone.text}`}>{label}</span>;
}

export default function SystemEventLogCard() {
  const rows: SystemEvent[] = [
    {
      id: "e3b4c0a1-9d2f-4a7b-9c87-1a2b3c4d5e6f",
      timestamp: "2025-10-12 22:46:11",
      source: "AuthService",
      userName: "Alex Johnson",
      tag: "Sales Invoice",
      message: "Login attempt failed for user 'guest'.",
    },
    {
      id: "b3472c8e-5fd8-43d7-92a1-11b22c33d44e",
      timestamp: "2025-10-12 22:45:02",
      source: "System",
      userName: "System",
      tag: "Inventory",
      message: "Startup completed successfully.",
    },
    {
      id: "b3472c8e-5fd8-43d7-92a1-11b22c33d44f",
      timestamp: "2025-10-12 22:45:02",
      source: "System",
      userName: "Maria Gomez",
      tag: "Inbound Invoice",
      message: "Startup completed successfully.",
    },
    {
      id: "b3472c8e-5fd8-43d7-92a1-11b22c33d44a",
      timestamp: "2025-10-12 22:45:02",
      source: "System",
      userName: "David Nguyen",
      tag: "Sales Invoice",
      message: "Startup completed successfully.",
    },
  ];

  const columns: Column<SystemEvent>[] = [
    {
      id: "uuid",
      header: "UUID",
      icon: <GitCommit className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => <span className="font-mono text-[13px] text-neutral-700 dark:text-neutral-200">{truncateUuid(r.id)}</span>,
      thClassName: "w-[120px]",
    },
    {
      id: "timestamp",
      header: "Time Stamp",
      icon: <ClockIcon className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => <span className="tabular-nums text-neutral-700 dark:text-neutral-200">{r.timestamp}</span>,
      thClassName: "w-[160px]",
    },
    {
      id: "source",
      header: "Source",
      icon: <UserIcon className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => <span className="text-neutral-700 dark:text-neutral-200">{r.userName}</span>,
      thClassName: "w-[140px]",
    },
    {
      id: "tag",
      header: "Tag",
      icon: <TagIcon className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => <TagPill label={r.tag} />,
      thClassName: "w-[160px]",
    },
    {
      id: "message",
      header: "Message",
      icon: <MessageSquareText className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => <span className="truncate text-neutral-700 dark:text-neutral-200">{r.message}</span>,
      tdClassName: "max-w-[520px]",
    },
  ];

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            <Images className="h-4 w-4 text-neutral-600 dark:text-neutral-300" strokeWidth={2} />
          <span>System Event Log</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs shadow-sm dark:bg-neutral-900">
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <span>Filter</span>
          </button>
          <IconCircleButton aria-label="Open detailed view">
            <ExternalLink className="h-4 w-4" />
          </IconCircleButton>
          <Tooltip content="Recent activity & how to read these logs">
            <button
              type="button"
              aria-label="About chart"
              className="text-neutral-300 transition-colors hover:text-neutral-500 focus:outline-none"
            >
              <Info className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      <DataTable<SystemEvent>
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
      />
    </div>
  );
}
