"use client";

import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ReceiptText,
  Settings as SettingsIcon,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

export function Sidebar() {
  const dict = useDict();

  const groups: Group[] = [
    {
      id: "admin",
      label: dict.admin,
      icon: <Users className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: true,
      items: [
        { href: "/dashboard", label: dict.dashboard, icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/report", label: dict.report, icon: <FileText className="h-4 w-4" />, disabled: true },
        { href: "/accounts", label: dict.manageAccounts, icon: <Users className="h-4 w-4" />, disabled: true },
      ],
    },
    {
      id: "cashier",
      label: dict.cashier,
      icon: <Store className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: "/invoices", label: dict.salesInvoices, icon: <ReceiptText className="h-4 w-4" /> },
        { href: "/invoices/report", label: dict.report, icon: <FileText className="h-4 w-4" />, disabled: true },
      ],
    },
    {
      id: "manager",
      label: dict.manager,
      icon: <ClipboardList className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: "/manager/product-inventory", label: dict.productInventory, icon: <FolderOpen className="h-4 w-4" /> },
        { href: "/manager/inbound-invoices", label: dict.inboundInvoices, icon: <FileCheck2 className="h-4 w-4" />, disabled: true },
        { href: "/manager/stock-audit-logs", label: dict.stockAuditLogs, icon: <ClipboardList className="h-4 w-4" />, disabled: true },
      ],
    },
    { id: "notifications", label: dict.notifications, icon: <Bell className="h-4 w-4" /> },
    { id: "settings", label: dict.settings, icon: <SettingsIcon className="h-4 w-4" /> },
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
      } catch { }
    }, [id, open]);

    return [open, setOpen] as const;
  }

  function GroupSection({ group }: { group: Group }) {
    const pathname = usePathname();
    const hasChildren = (group.items?.length ?? 0) > 0;

    const [open, setOpen] = usePersistedOpen(group.id, group.defaultOpen ?? false);

    const childActive = useMemo(
      () => group.items?.some((i) => !!i.href && pathname.startsWith(i.href)) ?? false,
      [group.items, pathname]
    );

    useEffect(() => {
      if (childActive && !open) {
        setOpen(true);
      }
    }, [childActive, open, setOpen]);

    return (
      <div>
        <button
          className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-text hover:bg-bg"
          onClick={() => {
            if (hasChildren) setOpen((v) => !v);
          }}
          aria-expanded={open}
        >
          <span className="inline-flex items-center gap-2">
            <span className="text-muted">{group.icon}</span>
            <span>{group.label}</span>
          </span>

          {hasChildren ? (
            <ChevronDown
              className={clsx(
                "h-4 w-4 text-muted transition-transform",
                open && "rotate-180"
              )}
            />
          ) : (
            <span />
          )}
        </button>

        {hasChildren && open && (
          <div className="relative ml-3 mt-1 pl-3">
            <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />

            <ul className="space-y-1">
              {group.items!.map((item) => {
                const active = !!item.href && pathname.startsWith(item.href);

                const content = (
                  <div
                    className={clsx(
                      "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                      item.disabled && "opacity-50 cursor-not-allowed",
                      active
                        ? "bg-card text-text"
                        : "text-muted hover:bg-bg"
                    )}
                  >
                    {/* connector curve */}
                    <span
                      aria-hidden
                      className="absolute -left-3 top-2 h-4 w-3 rounded-bl border-b border-l border-border"
                    />

                    <span className="shrink-0 text-muted">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                );

                return (
                  <li key={item.label}>
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
  return (
    <aside className="sticky top-0 hidden shrink-0 self-start overflow-hidden border-r border-border bg-card text-text md:flex print:hidden">
      <div className="flex h-screen min-w-0 flex-col gap-6 p-4">

        {/* Brand */}
        <div className="flex items-center gap-2 px-2 pt-2 text-sm font-semibold">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-bg text-muted">
            <div className="grid h-4 w-4 grid-cols-2 gap-0.5">
              <span className="block rounded-sm" />
              <span className="block rounded-sm" />
              <span className="block rounded-sm" />
              <span className="block rounded-sm" />
            </div>
          </div>

          <span>{dict.inventorySystem}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 overflow-y-auto pr-2">
          {groups.map((g) => (
            <GroupSection key={g.id} group={g} />
          ))}
        </nav>

        {/* User Card */}
        <div className="rounded-md border border-border bg-bg p-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />

            <div className="min-w-0">
              <div className="truncate text-text">John</div>
              <div className="truncate text-xs text-muted">
                john.doe@gmail.com
              </div>
            </div>

            <button
              aria-label={dict.openProfile}
              className="ml-auto rounded-md p-1 text-muted hover:bg-card"
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