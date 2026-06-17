"use client";

import DataTable, {
  type Column,
  type SortDirection,
} from "@/components/ui/DataTable";
import { sortReturnChildrenRows, type ReturnChildSortField } from "@/features/invoices/lib/invoiceListSort";
import { useDict } from "@/lib/lang/DictProvider";

type InvoiceListExpandedReturnsPanelProps<TChild> = {
  loading: boolean;
  returnRows: TChild[];
  columns: Column<TChild>[];
  sortField: ReturnChildSortField;
  sortDirection: SortDirection;
  onSort: (field: string) => void;
  sortAccessors: {
    getReturnInvoiceId: (row: TChild) => string | null;
    getUserName: (row: TChild) => string | null;
    getCreatedAt: (row: TChild) => string | null;
  };
  getRowId: (row: TChild) => string | number;
};

export default function InvoiceListExpandedReturnsPanel<TChild>({
  loading,
  returnRows,
  columns,
  sortField,
  sortDirection,
  onSort,
  sortAccessors,
  getRowId,
}: InvoiceListExpandedReturnsPanelProps<TChild>) {
  const dict = useDict();
  const sortedChildren = sortReturnChildrenRows(
    returnRows,
    sortField,
    sortDirection,
    sortAccessors,
  );

  if (loading) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted">
        {dict.loading}
      </div>
    );
  }

  if (sortedChildren.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-muted">{dict.noRelatedReturns}</div>
    );
  }

  return (
    <DataTable<TChild>
      columns={columns}
      data={sortedChildren}
      getRowId={getRowId}
      sortField={sortField}
      sortDirection={sortDirection}
      onSort={function handleNestedSort(field): void {
        onSort(String(field));
      }}
      maxHeight="240px"
      className="overflow-x-hidden"
      showHeader={false}
      embedded
      leadingRail
      emptyMessage={dict.noRelatedReturns}
    />
  );
}
