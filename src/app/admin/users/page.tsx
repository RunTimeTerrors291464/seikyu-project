"use client";

import type { Accent } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import TablePagination from "@/components/ui/TablePagination";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import CreateUserPopup from "@/features/admin/layout/CreateUserPopup";
import EditUserPopup from "@/features/admin/layout/EditUserPopup";
import { userRoleListFilterButtonClassName } from "@/features/admin/lib/userRolePillStyles";
import {
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
  type UserListQuery,
  type UserListSortBy,
  type UserResponseDto,
  type UserRoleCode,
} from "@/features/admin/services/adminUsers.service";
import { adminUserColumns } from "@/features/admin/table/adminUsersColumns";
import { useDict } from "@/lib/lang/DictProvider";
import useShortcut from "@/lib/shortcuts/useShortcut";
import {
  UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
  UNIVERSAL_NEW_SHORTCUT_CHORD,
  UNIVERSAL_NEW_SHORTCUT_ID,
  UNIVERSAL_NEW_SHORTCUT_FALLBACK_LABEL,
} from "@/lib/shortcuts/universalShortcut";
import { getFilterPillClassName } from "@/lib/ui/filterPillClassName";
import { AtSign, Filter, Plus, RotateCcw, User as UserIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type SortOrder = "asc" | "desc";

type ActiveFilter = "all" | "true" | "false";

type SearchRule = "fullName" | "username";

const USER_LIST_SORT_FIELDS: readonly UserListSortBy[] = [
  "fullName",
  "username",
  "createdAt",
  "updatedAt",
  "isActive",
];

function activeFilterAccent(value: ActiveFilter): Accent {
  if (value === "true") {
    return "success";
  }
  if (value === "false") {
    return "danger";
  }
  return "neutral";
}

/**
 * Admin users list: search, filters, and user management backed by platform admin APIs.
 *
 * **Role filter chips:** With none selected, `roles` is omitted from the list query (all users).
 * With one or more selected, the query includes those codes so the API returns users who
 * **include at least one** of the selected roles. The roles **column** always shows **every**
 * role on that user in order Admin → Manager → Cashier; it is never reduced to the active filter.
 */
export default function AdminUsersPage() {
  const dict = useDict();

  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(30);
  const [search, setSearch] = useState<string>("");
  const [searchRule, setSearchRule] = useState<SearchRule>("fullName");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [ruleInputResetKey, setRuleInputResetKey] = useState<number>(0);
  const [sortBy, setSortBy] = useState<UserListSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [roleFilter, setRoleFilter] = useState<Set<UserRoleCode>>(new Set());

  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [editUser, setEditUser] = useState<UserResponseDto | null>(null);

  const listQuery = useMemo(
    function buildListQuery(): UserListQuery {
      return {
        page,
        limit: rowsPerPage,
        search: search.trim() || undefined,
        searchBy:
          search.trim().length > 0 ? searchRule : undefined,
        // List filter only; each row still renders full `row.roles` in the table (see adminUserColumns).
        roles:
          roleFilter.size > 0 ? Array.from(roleFilter) : undefined,
        isActive: activeFilter,
        sortBy,
        sortOrder,
      };
    },
    [
      page,
      rowsPerPage,
      search,
      searchRule,
      activeFilter,
      sortBy,
      sortOrder,
      roleFilter,
    ],
  );

  const { rows, total, loading, error, refetch } = useAdminUsers(listQuery);

  const onEdit = useCallback(function handleEdit(row: UserResponseDto): void {
    setEditUser(row);
  }, []);

  const handleUniversalNewShortcut = useCallback(function handleUniversalNewShortcut(
    _event: KeyboardEvent,
  ): void {
    void _event;
    setCreateOpen(true);
  }, []);

  useShortcut({
    id: UNIVERSAL_NEW_SHORTCUT_ID,
    chord: UNIVERSAL_NEW_SHORTCUT_CHORD,
    label: UNIVERSAL_NEW_SHORTCUT_FALLBACK_LABEL,
    handler: handleUniversalNewShortcut,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
  });

  const columns = useMemo(
    function buildColumns() {
      return adminUserColumns(dict, { onEdit }, {
        page,
        rowsPerPage,
      });
    },
    [dict, onEdit, page, rowsPerPage],
  );

  function handleSort(nextField: string): void {
    if (!USER_LIST_SORT_FIELDS.includes(nextField as UserListSortBy)) {
      return;
    }

    if (sortBy !== nextField) {
      setSortBy(nextField as UserListSortBy);
      setSortOrder("asc");
      setPage(1);
      return;
    }

    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setPage(1);
  }

  const totalPages = total === 0 ? 1 : Math.ceil(total / rowsPerPage);

  const isResetFilterDisabled =
    search.length === 0 &&
    searchRule === "fullName" &&
    activeFilter === "all" &&
    roleFilter.size === 0 &&
    sortBy === "createdAt" &&
    sortOrder === "desc" &&
    page === 1 &&
    showFilters === false;

  function handleResetFilters(): void {
    setSearch("");
    setSearchRule("fullName");
    setActiveFilter("all");
    setRoleFilter(new Set());
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
    setShowFilters(false);
    setRuleInputResetKey((value) => value + 1);
  }

  function toggleRoleFilter(role: UserRoleCode): void {
    setRoleFilter((previous) => {
      const next = new Set(previous);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
    setPage(1);
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="flex items-center justify-start gap-2">
          <h1 className="text-xl font-semibold">{dict.usersPageTitle}</h1>
        </div>

        <div className="w-full max-w-xl">
          <RuleInput
            key={ruleInputResetKey}
            options={[
              {
                label: dict.userSearchByNameRule,
                icon: <UserIcon className="h-3 w-3" />,
              },
              {
                label: dict.userSearchByUsernameRule,
                icon: <AtSign className="h-3 w-3" />,
              },
            ]}
            placeholder={dict.searchPlaceholder}
            onChange={({ rule, value }) => {
              if (rule === dict.userSearchByUsernameRule) {
                setSearchRule("username");
              } else {
                setSearchRule("fullName");
              }
              setSearch(value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            icon={<Filter className="h-3.5 w-3.5" />}
            accent={showFilters ? "primary" : "neutral"}
            size="sm"
            onClick={() => {
              setShowFilters((value) => !value);
            }}
          >
            <span>{dict.filter}</span>
          </Button>

          <Button
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            accent="neutral"
            size="sm"
            onClick={handleResetFilters}
            disabled={isResetFilterDisabled}
          >
            {dict.resetFilter}
          </Button>

          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            accent="primary"
            size="sm"
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            {dict.createUserTitle}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-danger">{dict.userListLoadError}</p>
      ) : null}

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">{dict.status}</span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { value: "all" as const, label: dict.all },
                  { value: "true" as const, label: dict.active },
                  { value: "false" as const, label: dict.inactive },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setActiveFilter(option.value);
                    setPage(1);
                  }}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-opacity ${getFilterPillClassName(
                    option.value,
                    activeFilter,
                    "all",
                    activeFilterAccent,
                  )}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">{dict.rolesLabel}</span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  [USER_ROLE_ADMIN, dict.admin],
                  [USER_ROLE_MANAGER, dict.manager],
                  [USER_ROLE_CASHIER, dict.cashier],
                ] as const
              ).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    toggleRoleFilter(code);
                  }}
                  className={userRoleListFilterButtonClassName(
                    code,
                    roleFilter.has(code),
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        maxHeight="fill"
        sortField={sortBy}
        sortDirection={sortOrder}
        onSort={handleSort}
        emptyMessage={dict.noData}
      />

      <TablePagination
        page={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
        setPage={setPage}
        totalResults={total}
        dict={dict}
      />

      <CreateUserPopup
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
        onCreated={() => {
          refetch();
        }}
      />

      <EditUserPopup
        open={editUser !== null}
        user={editUser}
        onClose={() => {
          setEditUser(null);
        }}
        onSaved={() => {
          refetch();
        }}
      />
    </div>
  );
}
