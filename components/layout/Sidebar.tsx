"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ChevronDown,
  LayoutDashboard,
  FileText,
  Users,
  Store,
  Bell,
  Settings as SettingsIcon,
  FolderOpen,
  ReceiptText,
  ClipboardList,
  FileCheck2,
  ExternalLink,
} from "lucide-react";

type Item = {
  href?: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

type Group = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  items?: Item[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

const groups: Group[] = [
  {
    id: "admin",
    label: "Admin",
    icon: <Users className="h-4 w-4" />,
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/report", label: "Report", icon: <FileText className="h-4 w-4" />, disabled: true },
      { href: "/accounts", label: "Manage Accounts", icon: <Users className="h-4 w-4" />, disabled: true },
    ],
  },
  {
    id: "cashier",
    label: "Cashier",
    icon: <Store className="h-4 w-4" />,
    collapsible: true,
    defaultOpen: false,
    items: [
      { href: "/invoices", label: "Sales Invoices", icon: <ReceiptText className="h-4 w-4" /> },
      { href: "/invoices/report", label: "Report", icon: <FileText className="h-4 w-4" />, disabled: true },
    ],
  },
  {
    id: "manager",
    label: "Manager",
    icon: <ClipboardList className="h-4 w-4" />,
    collapsible: true,
    defaultOpen: false,
    items: [
      { href: "/manager/product-inventory", label: "Product Inventory", icon: <FolderOpen className="h-4 w-4" />, disabled: true },
      { href: "/manager/inbound-invoices", label: "Inbound Invoices", icon: <FileCheck2 className="h-4 w-4" />, disabled: true },
      { href: "/manager/stock-audit-logs", label: "Stock Audit Logs", icon: <ClipboardList className="h-4 w-4" />, disabled: true },
    ],
  },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon className="h-4 w-4" /> },
];

function usePersistedOpen(id: string, initial: boolean) {
  const [open, setOpen] = useState(initial);
  useEffect(() => {
    const raw = localStorage.getItem(`sidebar-open:${id}`);
    if (raw !== null) setOpen(raw === "1");
  }, [id]);
  useEffect(() => {
    try {
      localStorage.setItem(`sidebar-open:${id}`, open ? "1" : "0");
    } catch {}
  }, [id, open]);
  return [open, setOpen] as const;
}

function GroupSection({ group }: { group: Group }) {
  const pathname = usePathname();
  const hasChildren = (group.items?.length ?? 0) > 0;
  const [open, setOpen] = usePersistedOpen(
    group.id,
    group.defaultOpen ?? false
  );

  // auto-open when a child is active
  const childActive = useMemo(
    () => group.items?.some((i) => !!i.href && pathname.startsWith(i.href)) ?? false,
    [group.items, pathname]
  );
  useEffect(() => {
    let firstOpen = true;
    if (firstOpen && childActive && !open) {
      setOpen(true);
      firstOpen = false;
    }
  }, []);

  return (
    <div>
      <button
        className={clsx(
          "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-slate-200",
          "hover:bg-slate-800/60"
        )}
        onClick={() => {
          if (hasChildren) setOpen((v) => !v);
        }}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-slate-300">{group.icon}</span>
          <span>{group.label}</span>
        </span>
        {hasChildren ? (
          <ChevronDown
            className={clsx("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")}
          />
        ) : (
          <span />
        )}
      </button>

      {hasChildren && open && (
        <div className="relative ml-3 mt-1 pl-3">
          <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-700/60" aria-hidden />
          <ul className="space-y-1">
            {group.items!.map((item) => {
              const active = !!item.href && pathname.startsWith(item.href);
              const content = (
                <div
                  className={clsx(
                    "group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    item.disabled && "opacity-50 cursor-not-allowed",
                    active
                      ? "bg-slate-700/60 text-white"
                      : "text-slate-300 hover:bg-slate-800/60"
                  )}
                >
                  {/* connector curve */}
                  <span
                    aria-hidden
                    className={clsx("absolute -left-3 top-2 h-4 w-3 rounded-bl border-b border-l border-slate-700/60")}
                  />
                  <span className="shrink-0 text-slate-300">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              );

              return (
                <li key={item.label} className="relative">
                  {item.disabled || !item.href ? (
                    <span>{content}</span>
                  ) : (
                    <Link href={item.href}>{content}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const sidebarWidth = "clamp(240px, 16vw, 320px)";
  return (
    <aside
      className="sticky top-0 hidden shrink-0 self-start overflow-hidden border-r border-slate-800 bg-slate-900 text-slate-200 md:flex"
      style={{ width: sidebarWidth }}
    >
      <div
        className={clsx(
          "flex h-screen min-w-0 flex-col gap-6 p-4"
        )}
        style={{ width: "100%" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-2 pt-2 text-sm font-semibold">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-slate-800 text-slate-300">
            {/* simple grid icon */}
            <div className="grid h-4 w-4 grid-cols-2 gap-0.5">
              <span className="block rounded-sm bg-slate-600" />
              <span className="block rounded-sm bg-slate-600" />
              <span className="block rounded-sm bg-slate-600" />
              <span className="block rounded-sm bg-slate-600" />
            </div>
          </div>
          <span className={clsx("text-slate-100")}>Inventory System</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-2">
          {groups.map((g) => (
            <GroupSection key={g.id} group={g} />
          ))}
        </nav>

        {/* User Card */}
        <div className={clsx("rounded-md border border-slate-800 bg-slate-800/40 p-3 text-sm")}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-700" />
            <div className={clsx("min-w-0")}> 
              <div className="truncate text-slate-100">John</div>
              <div className="truncate text-xs text-slate-400">john.doe@gmail.com</div>
            </div>
            <button aria-label="Open profile" className={clsx("ml-auto rounded-md p-1 text-slate-300 hover:bg-slate-700")}
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
