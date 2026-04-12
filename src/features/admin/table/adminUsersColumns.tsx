import { formatDate } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import type { Column } from "@/components/ui/DataTable";
import UserRolePill from "@/features/admin/components/UserRolePill";
import ActivePill from "@/features/products/components/ActivePill";
import type { Dictionary } from "@/lib/lang/i18n";
import type { PaginatedRowIndexParams } from "@/lib/table/paginatedRowDisplayIndex";
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import {
  AtSign,
  CirclePower,
  Clock,
  Pencil,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react";

import type { AdminUserRow } from "../hooks/useAdminUsers";
import {
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
  type UserRoleCode,
} from "../services/adminUsers.service";

/** Fixed column order: Admin, then Manager, then Cashier. */
const ROLE_DISPLAY_ORDER: readonly UserRoleCode[] = [
  USER_ROLE_ADMIN,
  USER_ROLE_MANAGER,
  USER_ROLE_CASHIER,
];

/**
 * Returns every role on the user, ordered Admin → Manager → Cashier.
 * List filters on the users page never subset this list—only which rows appear.
 *
 * @param roles - Full `roles` array from the API for one user.
 * @returns Those roles, stable-sorted for display.
 */
function rolesInDisplayOrder(roles: UserRoleCode[]): UserRoleCode[] {
  const present = new Set(roles);
  return ROLE_DISPLAY_ORDER.filter((code) => present.has(code));
}

type AdminUserColumnActions = {
  onEdit: (row: AdminUserRow) => void;
};

/** Shared width for full name and username columns (`<col>` + cell overflow). */
const NAME_AND_USERNAME_WIDTH = "220px";
const NAME_AND_USERNAME_TD_MAX = "max-w-[220px]";

function displayFullName(row: AdminUserRow): string {
  return [row.firstName, row.middleName, row.lastName]
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter(Boolean)
    .join(" ");
}

/**
 * Builds table columns for the admin users list.
 *
 * @param dict - UI strings.
 * @param actions - Row action callbacks.
 * @param rowIndexPagination - Optional # column using page/limit.
 * @returns Column definitions for `DataTable`.
 */
export function adminUserColumns(
  dict: Dictionary,
  actions: AdminUserColumnActions,
  rowIndexPagination?: PaginatedRowIndexParams,
): Column<AdminUserRow>[] {
  return [
    rowIndexColumn<AdminUserRow>({ pagination: rowIndexPagination }),
    {
      id: "fullName",
      header: dict.userFullNameColumn,
      width: NAME_AND_USERNAME_WIDTH,
      icon: <UserIcon className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      sortable: false,
      accessor: (row) => (
        <span className="block truncate font-medium text-text">
          {displayFullName(row)}
        </span>
      ),
      tdClassName: NAME_AND_USERNAME_TD_MAX,
    },
    {
      id: "username",
      header: dict.username,
      width: NAME_AND_USERNAME_WIDTH,
      icon: <AtSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      field: "username",
      sortable: true,
      accessor: (row) => (
        <span className="block truncate text-text">{row.username}</span>
      ),
      tdClassName: NAME_AND_USERNAME_TD_MAX,
    },
    {
      id: "roles",
      header: dict.rolesLabel,
      width: "min-content",
      icon: <Shield className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      sortable: false,
      accessor: (row) => (
        <div className="inline-flex flex-nowrap items-center gap-1">
          {/* Always every role on the user (Admin→Manager→Cashier); not intersected with list filters. */}
          {rolesInDisplayOrder(row.roles).map((role: UserRoleCode) => (
            <UserRolePill key={role} role={role} dict={dict} />
          ))}
        </div>
      ),
      thClassName: "whitespace-nowrap",
      tdClassName: "whitespace-nowrap",
    },
    {
      id: "isActive",
      header: dict.status,
      icon: <CirclePower className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      sortable: false,
      accessor: (row) => <ActivePill active={row.isActive} />,
      thClassName: "w-[120px]",
    },
    {
      id: "createdAt",
      header: dict.createdAt,
      icon: <Clock className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      field: "createdAt",
      sortable: true,
      sortAccessor: (row) => row.createdAt,
      accessor: (row) => (
        <span className="tabular-nums text-text">
          {formatDate(row.createdAt)}
        </span>
      ),
      thClassName: "w-[140px]",
    },
    {
      id: "actions",
      header: dict.actionsLabel,
      icon: <Settings className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      sortable: false,
      accessor: (row) => (
        <Button
          size="sm"
          accent="neutral"
          icon={<Pencil className="h-3.5 w-3.5" />}
          onClick={() => {
            actions.onEdit(row);
          }}
        >
          {dict.edit}
        </Button>
      ),
      thClassName: "w-[120px]",
    },
  ];
}
