"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { formatDate } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import { useDict } from "@/lib/lang/DictProvider";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { Download, Printer, X } from "lucide-react";

export type InvoicePrintLine = {
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  lineTotal: number;
  notes: string | null;
};

export type InvoicePrintData = {
  invoiceCode: string;
  status: "draft" | "confirmed" | "partiallyReturned" | "returned";
  createdBy: string | null;
  createdAt: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  notes: string | null;
  totalProducts: number;
  totalQuantity: number;
  totalAmount: number;
  showLineNotes?: boolean;
  lines: InvoicePrintLine[];
};

type InvoicePrintPreviewPopupProps = {
  open: boolean;
  title: string;
  data: InvoicePrintData;
  onClose: () => void;
};

const sharedPdfStyles = {
  page: {
    padding: 34,
    fontSize: 10,
    color: "#000",
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  textSm: {
    fontSize: 10,
    marginBottom: 2,
  },
  rightText: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: "right",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  tableRow: {
    flexDirection: "row",
  },
  cellHeader: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    padding: 4,
    fontSize: 9,
    fontWeight: 700,
  },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    padding: 4,
    fontSize: 9,
  },
  noRightBorder: {
    borderRightWidth: 0,
  },
  alignRight: {
    textAlign: "right",
  },
  totals: {
    marginTop: 12,
    gap: 4,
  },
  totalStrong: {
    fontWeight: 700,
  },
  notes: {
    marginTop: 12,
    gap: 4,
  },
  noteLabel: {
    fontWeight: 700,
  },
} as const;

const pdfStylesWithNotes = StyleSheet.create({
  ...sharedPdfStyles,
  colIndex: { width: "6%" },
  colSku: { width: "16%" },
  colName: { width: "31%" },
  colUnit: { width: "10%" },
  colQty: { width: "12%" },
  colTotal: { width: "15%" },
  colNote: { width: "20%" },
});

const pdfStylesWithoutNotes = StyleSheet.create({
  ...sharedPdfStyles,
  colIndex: { width: "6%" },
  colSku: { width: "16%" },
  colName: { width: "41%" },
  colUnit: { width: "10%" },
  colQty: { width: "12%" },
  colTotal: { width: "15%" },
});

type InvoicePdfLabels = {
  invoiceNumber: string;
  status: string;
  by: string;
  date: string;
  sku: string;
  productName: string;
  unit: string;
  quantityLabel: string;
  totalPriceLabel: string;
  noteLabel: string;
  noNote: string;
};

function InvoicePdfDocument({
  title,
  data,
  labels,
}: {
  title: string;
  data: InvoicePrintData;
  labels: InvoicePdfLabels;
}) {
  const hasNotes = Boolean(data.showLineNotes);
  const styles = hasNotes ? pdfStylesWithNotes : pdfStylesWithoutNotes;
  const statusText = data.status;

  return (
    <Document title={data.invoiceCode}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.textSm}>{labels.invoiceNumber}: {data.invoiceCode}</Text>
            <Text style={styles.textSm}>{labels.status}: {statusText}</Text>
          </View>
          <View>
            <Text style={styles.rightText}>{labels.by}: {data.confirmedBy ?? "—"}</Text>
            <Text style={styles.rightText}>{labels.date}: {data.confirmedAt ? formatDate(data.confirmedAt) : "—"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <Text style={[styles.cellHeader, styles.colIndex]}>#</Text>
            <Text style={[styles.cellHeader, styles.colSku]}>{labels.sku}</Text>
            <Text style={[styles.cellHeader, styles.colName]}>{labels.productName}</Text>
            <Text style={[styles.cellHeader, styles.colQty]}>{labels.quantityLabel}</Text>
            <Text style={[styles.cellHeader, styles.colUnit]}>{labels.unit}</Text>
            <Text
              style={[
                styles.cellHeader,
                styles.colTotal,
                styles.alignRight,
                ...(!hasNotes ? [styles.noRightBorder] : []),
              ]}
            >
              {labels.totalPriceLabel}
            </Text>
            {hasNotes && (
              <Text style={[styles.cellHeader, pdfStylesWithNotes.colNote, styles.noRightBorder]}>{labels.noteLabel}</Text>
            )}
          </View>

          {data.lines.map((line, index) => {
            return (
              <View key={`${line.sku}-${index}`} style={styles.tableRow}>
                <Text style={[styles.cell, styles.colIndex]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.colSku]}>{line.sku}</Text>
                <Text style={[styles.cell, styles.colName]}>{line.name}</Text>
                <Text style={[styles.cell, styles.colQty]}>{line.quantity.toLocaleString()}</Text>
                <Text style={[styles.cell, styles.colUnit]}>{line.unit}</Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colTotal,
                    styles.alignRight,
                    ...(!hasNotes ? [styles.noRightBorder] : []),
                  ]}
                >
                  {formatPriceNumber(line.lineTotal)}
                </Text>
                {hasNotes && (
                  <Text style={[styles.cell, pdfStylesWithNotes.colNote, styles.noRightBorder]}>
                    {line.notes?.trim() ? line.notes : labels.noNote}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <Text style={styles.totalStrong}>{labels.totalPriceLabel}: {formatPriceNumber(data.totalAmount)}</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function InvoicePrintPreviewPopup({
  open,
  title,
  data,
  onClose,
}: InvoicePrintPreviewPopupProps) {
  const dict = useDict();

  function buildPdfLabels(): InvoicePdfLabels {
    return {
      invoiceNumber: dict.invoiceNumber,
      status: dict.status,
      by: dict.by,
      date: dict.date,
      sku: dict.sku,
      productName: dict.productName,
      unit: dict.unit,
      quantityLabel: dict.quantityLabel,
      totalPriceLabel: dict.totalPriceLabel,
      noteLabel: dict.noteLabel,
      noNote: "No note",
    };
  }

  async function createInvoicePdfBlob(): Promise<Blob> {
    const labels = buildPdfLabels();
    return pdf(<InvoicePdfDocument title={title} data={data} labels={labels} />).toBlob();
  }

  async function handlePrint(): Promise<void> {
    const blob = await createInvoicePdfBlob();
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, "_blank");
    if (!win) {
      URL.revokeObjectURL(blobUrl);
    }
  }

  async function handleSavePdf(): Promise<void> {
    const blob = await createInvoicePdfBlob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeInvoiceCode = data.invoiceCode.replace(/[^\w.-]+/g, "_");
    link.href = blobUrl;
    link.download = `invoice-${safeInvoiceCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <Popup open={open} onClose={onClose}>
      <div className="flex w-[92vw] max-w-[980px] h-[90vh] flex-col overflow-auto">
        <div className="no-print flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">{dict.printPreview}</h2>
          <div className="flex items-center gap-2">
            <Button icon={<Download className="h-3.5 w-3.5" />} accent="neutral" onClick={handleSavePdf}>
              {dict.saveAsPdf}
            </Button>
            <Button icon={<Printer className="h-3.5 w-3.5" />} accent="primary" onClick={handlePrint}>
              {dict.print}
            </Button>
            <Button icon={<X className="h-3.5 w-3.5" />} accent="neutral" onClick={onClose}>
              {dict.close}
            </Button>
          </div>
        </div>

        <div className="print-area-container flex-1 overflow-auto bg-bg p-4">
          <div className="print-area mx-auto w-full min-h-full max-w-[210mm] bg-white p-[12mm] text-black">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-sm">{dict.invoiceNumber}: {data.invoiceCode}</p>
                <p className="text-sm">{dict.status}: {dict[data.status]}</p>
              </div>
              <div className="text-right text-sm">
                <p>{dict.by}: {data.confirmedBy ?? "—"}</p>
                <p>{dict.date}: {data.confirmedAt ? formatDate(data.confirmedAt) : "—"}</p>
              </div>
            </div>

            <table className="w-full border border-border text-sm">
              <thead>
                <tr>
                  <th className="border border-border px-2 py-1 text-left">#</th>
                  <th className="border border-border px-2 py-1 text-left">{dict.sku}</th>
                  <th className="border border-border px-2 py-1 text-left">{dict.productName}</th>
                  <th className="border border-border px-2 py-1 text-left">{dict.quantityLabel}</th>
                  <th className="border border-border px-2 py-1 text-left">{dict.unit}</th>
                  <th className="border border-border px-2 py-1 text-right">{dict.totalPriceLabel}</th>
                  {data.showLineNotes && (
                    <th className="border border-border px-2 py-1 text-left">{dict.noteLabel}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.lines.map(function renderLine(line, index) {
                  return (
                    <tr key={`${line.sku}-${index}`}>
                      <td className="border border-border px-2 py-1">{index + 1}</td>
                      <td className="border border-border px-2 py-1">{line.sku}</td>
                      <td className="border border-border px-2 py-1">{line.name}</td>
                      <td className="border border-border px-2 py-1">{line.quantity.toLocaleString()}</td>
                      <td className="border border-border px-2 py-1">{line.unit}</td>
                      <td className="border border-border px-2 py-1 text-right">{formatPriceNumber(line.lineTotal)}</td>
                      {data.showLineNotes && (
                        <td className="border border-border px-2 py-1 break-all">
                          {line.notes?.trim() ? line.notes : "No note"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <p className="col-span-2 font-semibold">
                {dict.totalPriceLabel}: {formatPriceNumber(data.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Popup>
  );
}
