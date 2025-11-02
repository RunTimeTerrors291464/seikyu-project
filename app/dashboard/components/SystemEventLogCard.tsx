"use client";
import { Images, Filter, ExternalLink, Info, GitCommit, Clock as ClockIcon, MessageSquareText, Equal, Server } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import IconCircleButton from "@/components/ui/IconCircleButton";
import SeverityBadge, { Severity } from "@/components/ui/SeverityBadge";
import Tooltip from "@/components/ui/Tooltip";

export type SystemEvent = {
  id: string; // uuid
  timestamp: string; // ISO or formatted
  source: string;
  level: Severity;
  message: string;
};

function truncateUuid(id: string) {
  return id.length > 6 ? id.slice(0, 4) + "…" + id.slice(-3) : id;
}

export default function SystemEventLogCard() {
  const rows: SystemEvent[] = [
    {
      id: "e3b4c0a1-9d2f-4a7b-9c87-1a2b3c4d5e6f",
      timestamp: "2025-10-12 22:46:11",
      source: "AuthService",
      level: "WARNING",
      message: "Login attempt failed for user 'guest'.",
    },
    {
      id: "b3472c8e-5fd8-43d7-92a1-11b22c33d44e",
      timestamp: "2025-10-12 22:45:02",
      source: "System",
      level: "INFO",
      message: "Startup completed successfully.",
    },
    {
      id: "b3472c8e-5fd8-43d7-92a1-11b22c33d44f",
      timestamp: "2025-10-12 22:45:02",
      source: "System",
      level: "INFO",
      message: "Startup completed successfully.",
    },
    {
      id: "b3472c8e-5fd8-43d7-92a1-11b22c33d44a",
      timestamp: "2025-10-12 22:45:02",
      source: "System",
      level: "INFO",
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
      icon: <Server className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => <span className="text-neutral-700 dark:text-neutral-200">{r.source}</span>,
      thClassName: "w-[140px]",
    },
    {
      id: "level",
      header: "Level",
      icon: <Equal className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => <SeverityBadge level={r.level} />,
      thClassName: "w-[120px]",
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
            <Images className="h-4 w-4 text-neutral-600 dark:text-neutral-300" strokeWidth={2.5} />
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
            <IconCircleButton aria-label="About logs">
              <Info className="h-4 w-4" />
            </IconCircleButton>
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
