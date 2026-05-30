"use client";

import AppSettingsPopup from "@/components/layout/AppSettingsPopup";
import { ConfirmPopup } from "@/components/layout/Popup";
import {
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
  type UserRoleCode,
} from "@/features/admin/services/adminUsers.service";
import {
  effectiveRolesForSidebarNav,
  userHasAnyRole,
} from "@/lib/auth/authUser";
import { useDict } from "@/lib/lang/DictProvider";
import { useAuthStore } from "@/stores/auth.store";
import clsx from "clsx";
import {
  Boxes,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  FolderOpen,
  LogOut,
  PanelLeftClose,
  ReceiptText,
  Settings as SettingsIcon,
  Store,
  UserCog,
  Users
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
  /** When set, the group is shown only if the user has at least one of these roles. */
  requiredRoles?: readonly UserRoleCode[];
  /** For leaf rows (no `items`), runs when the row is activated (e.g. open settings). */
  onActivate?: () => void;
};

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const dict = useDict();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const allGroups: Group[] = [
    {
      id: "admin",
      label: dict.admin,
      icon: <Users className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: true,
      requiredRoles: [USER_ROLE_ADMIN],
      items: [
        // { href: "/admin/dashboard", label: dict.dashboard, icon: <LayoutDashboard className="h-4 w-4" /> },
        // { href: "/report", label: dict.report, icon: <FileText className="h-4 w-4" />, disabled: true },
        { href: "/admin/users", label: dict.usersNav, icon: <UserCog className="h-4 w-4" /> },
      ],
    },
    {
      id: "cashier",
      label: dict.cashier,
      icon: <Store className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: false,
      requiredRoles: [USER_ROLE_CASHIER],
      items: [
        { href: "/cashier/selling", label: dict.salesInvoices, icon: <ReceiptText className="h-4 w-4" /> },
        // { href: "/cashier/selling/report", label: dict.report, icon: <FileText className="h-4 w-4" />, disabled: true },
      ],
    },
    {
      id: "manager",
      label: dict.manager,
      icon: <ClipboardList className="h-4 w-4" />,
      collapsible: true,
      defaultOpen: false,
      requiredRoles: [USER_ROLE_MANAGER],
      items: [
        { href: "/manager/product-inventory", label: dict.productInventory, icon: <FolderOpen className="h-4 w-4" /> },
        { href: "/manager/invoices/import", label: dict.importInvoices, icon: <FileCheck2 className="h-4 w-4" /> },
        { href: "/manager/invoices/stock-adjustment", label: dict.stockAdjustmentInvoices, icon: <Boxes className="h-4 w-4" /> },
        { href: "/manager/invoices/selling", label: dict.sellingInvoicesManager, icon: <ReceiptText className="h-4 w-4" /> },
        // { href: "/manager/stock-audit-logs", label: dict.stockAuditLogs, icon: <ClipboardList className="h-4 w-4" />, disabled: true },
      ],
    },
    // { id: "notifications", label: dict.notifications, icon: <Bell className="h-4 w-4" /> },
    {
      id: "settings",
      label: dict.settings,
      icon: <SettingsIcon className="h-4 w-4" />,
      onActivate: () => {
        setSettingsOpen(true);
      },
    },
  ];

  const roleCodes = effectiveRolesForSidebarNav(authUser?.roles ?? []);

  const groups = allGroups.filter((group) => {
    if (!group.requiredRoles?.length) {
      return true;
    }

    return userHasAnyRole(roleCodes, group.requiredRoles);
  });

  function usePersistedOpen(id: string, initial: boolean) {
    const [open, setOpen] = useState(initial);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);

      try {
        const raw = localStorage.getItem(`sidebar-open:${id}`);
        if (raw !== null) {
          setOpen(raw === "1");
        }
      } catch { }
    }, [id]);

    useEffect(() => {
      if (!mounted) return;
      try {
        localStorage.setItem(`sidebar-open:${id}`, open ? "1" : "0");
      } catch { }
    }, [id, open, mounted]);

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
      if (childActive && !open) setOpen(true);
    }, [childActive, open, setOpen]);

    return (
      <div>
        {/* GROUP HEADER */}
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-text transition-colors hover:bg-hover"
          onClick={() => {
            if (group.onActivate) {
              group.onActivate();
              return;
            }

            if (!hasChildren) return;

            // prevent closing if current route is inside
            if (childActive && open) return;

            if (hasChildren) setOpen((v) => !v);
          }}
          aria-expanded={hasChildren ? open : undefined}
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

        {/* CHILD ITEMS */}
        {hasChildren && open && (
          <div className="relative ml-3 mt-1 pl-3">
            <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />

            <ul className="space-y-1">
              {group.items!.map((item) => {
                const active = !!item.href && pathname.startsWith(item.href);

                const content = (
                  <div
                    className={clsx(
                      "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-150 hover:translate-x-[2px]",
                      item.disabled && "opacity-50 cursor-not-allowed",
                      active
                        ? "bg-active text-text font-medium"
                        : "text-muted hover:bg-hover hover:text-text"
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

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="sticky top-0 hidden self-start overflow-hidden border-r border-border bg-card text-text md:flex print:hidden">
      <div className="flex w-72 h-screen min-w-0 flex-col gap-6 p-4">

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
          <button
            aria-label="Close sidebar"
            className="ml-auto inline-flex rounded-md p-1 text-muted transition-colors hover:bg-hover hover:text-text"
            onClick={onClose}
            type="button"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 overflow-y-auto pr-2">
          {groups.map((g) => (
            <GroupSection key={g.id} group={g} />
          ))}
        </nav>

        {/* Signed-in user + log out */}
        <div className="rounded-md border border-border bg-bg p-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate font-medium text-text">
              {authUser?.username ?? "—"}
            </div>
            <button
              type="button"
              aria-label={dict.logout}
              className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-text"
              onClick={() => {
                setLogoutConfirmOpen(true);
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      <AppSettingsPopup
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
        }}
      />

      <ConfirmPopup
        open={logoutConfirmOpen}
        backdropBlur={false}
        onClose={() => {
          setLogoutConfirmOpen(false);
        }}
        title={dict.confirmLogoutTitle}
        description={dict.confirmLogoutDescription}
        confirmText={dict.logout}
        cancelText={dict.cancel}
        accent="danger"
        icon={<LogOut className="h-3.5 w-3.5 text-danger" />}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
        }}
      />
    </aside>
  );
}

export default Sidebar;