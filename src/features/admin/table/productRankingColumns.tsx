import type { Column } from "@/components/ui/DataTable";
import type { ProductRankingRow } from "@/features/admin/hooks/useProductRanking";
import type { ProductRankingDateType } from "@/features/admin/services/dashboard.service";
import type { Dictionary } from "@/lib/lang/i18n";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import { paginatedRowDisplayIndex } from "@/lib/table/paginatedRowDisplayIndex";

function formatRankingPeriod(
  row: ProductRankingRow,
  dateType: ProductRankingDateType,
): string {
  if (dateType === "yearly") {
    return String(row.year);
  }

  if (dateType === "monthly") {
    return `${row.year}/${String(row.month).padStart(2, "0")}`;
  }

  return `${row.year}/${String(row.month).padStart(2, "0")}/${String(row.day).padStart(2, "0")}`;
}

export function productRankingColumns(
  dict: Dictionary,
  options: {
    dateType: ProductRankingDateType;
    pagination: { page: number; rowsPerPage: number };
  },
): Column<ProductRankingRow>[] {
  return [
    {
      id: "rank",
      header: "#",
      align: "center",
      width: "3rem",
      accessor: function renderRank(_row, rowIndex): number {
        return paginatedRowDisplayIndex(rowIndex, options.pagination);
      },
    },
    {
      id: "product",
      header: dict.productName,
      accessor: function renderProduct(row) {
        return (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.product.name}</p>
            <p className="truncate text-xs text-muted">{row.product.sku}</p>
          </div>
        );
      },
    },
    {
      id: "quantity",
      header: dict.dashboardRankingQuantityColumn,
      field: "quantity",
      align: "right",
      accessor: function renderQuantity(row): string {
        return row.quantity.toLocaleString();
      },
    },
    {
      id: "totalPrice",
      header: dict.totalSellingPriceLabel,
      field: "totalPrice",
      align: "right",
      accessor: function renderTotal(row): string {
        return formatPriceNumber(row.totalPrice);
      },
    },
    {
      id: "period",
      header: dict.dashboardRankingPeriodColumn,
      align: "right",
      accessor: function renderPeriod(row): string {
        return formatRankingPeriod(row, options.dateType);
      },
    },
  ];
}
