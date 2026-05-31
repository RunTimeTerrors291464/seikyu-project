"use client";

import { useDict } from "@/lib/lang/DictProvider";
import { useMemo } from "react";
import type { ReturnImportInvoiceWithoutProductsDto } from "../services/returnImportInvoice.service";
import { getReturnImportInvoiceList } from "../services/returnImportInvoice.service";
import { returnImportInvoiceListColumns } from "../table/returnImportInvoiceListColumns";
import RelatedReturnInvoicesCard from "./RelatedReturnInvoicesCard";

type ImportInvoiceReturnInvoicesCardProps = {
  /** Display import invoice number (e.g. I26-0000001) for `searchBy: importInvoiceId`. */
  importInvoiceNo: string | null;
};

export default function ImportInvoiceReturnInvoicesCard({
  importInvoiceNo,
}: ImportInvoiceReturnInvoicesCardProps) {
  const dict = useDict();
  const columns = useMemo(
    () =>
      returnImportInvoiceListColumns(dict, {
        page: 1,
        rowsPerPage: 100,
      }),
    [dict],
  );

  return (
    <RelatedReturnInvoicesCard<ReturnImportInvoiceWithoutProductsDto, "importInvoiceId">
      searchValue={importInvoiceNo}
      searchBy="importInvoiceId"
      title={dict.relatedReturnInvoices}
      emptyMessage={dict.noRelatedReturns}
      columns={columns}
      getRowId={function getRowId(row): string {
        return row.id;
      }}
      loadRows={async function loadRows(args) {
        return getReturnImportInvoiceList(args);
      }}
    />
  );
}
