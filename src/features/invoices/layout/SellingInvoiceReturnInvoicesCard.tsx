"use client";

import { useDict } from "@/lib/lang/DictProvider";
import { useMemo } from "react";
import RelatedReturnInvoicesCard from "./RelatedReturnInvoicesCard";
import type { ReturnSellingInvoiceWithoutProductsDto } from "../services/returnSellingInvoice.service";
import { getReturnSellingInvoiceList } from "../services/returnSellingInvoice.service";
import { returnSellingInvoiceListColumns } from "../table/returnSellingInvoiceListColumns";

type SellingInvoiceReturnInvoicesCardProps = {
  /** Display selling invoice number (e.g. S26-0000001) for `searchBy: sellingInvoiceId`. */
  sellingInvoiceNo: string | null;
};

export default function SellingInvoiceReturnInvoicesCard({
  sellingInvoiceNo,
}: SellingInvoiceReturnInvoicesCardProps) {
  const dict = useDict();
  const columns = useMemo(
    () =>
      returnSellingInvoiceListColumns(dict, {
        page: 1,
        rowsPerPage: 100,
      }),
    [dict],
  );

  return (
    <RelatedReturnInvoicesCard<ReturnSellingInvoiceWithoutProductsDto, "sellingInvoiceId">
      searchValue={sellingInvoiceNo}
      searchBy="sellingInvoiceId"
      title={dict.relatedReturnSellingInvoices}
      emptyMessage={dict.noRelatedReturns}
      columns={columns}
      getRowId={function getRowId(row): string {
        return row.id;
      }}
      loadRows={async function loadRows(args) {
        return getReturnSellingInvoiceList(args);
      }}
    />
  );
}
