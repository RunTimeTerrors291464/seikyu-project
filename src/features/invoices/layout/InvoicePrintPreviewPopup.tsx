"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import Select from "@/components/ui/Select";
import { Document, Font, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { Download, Languages, Printer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDict, useUiLang } from "@/lib/lang/DictProvider";
import type { Dictionary } from "@/lib/lang/i18n";
import { getDictionary, getPrintLangCookie, type Lang } from "@/lib/lang/i18n";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";

export type InvoicePrintLine = {
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
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
  data: InvoicePrintData;
  onClose: () => void;
};

type InvoiceTitleLabelKey =
  | "salesInvoices"
  | "importInvoices"
  | "returnSaleInvoices"
  | "returnImportInvoice";

function getInvoiceTitleLabelKey(invoiceCode: string): InvoiceTitleLabelKey {
  if (invoiceCode.startsWith("RS")) {
    return "returnSaleInvoices";
  }

  if (invoiceCode.startsWith("RI")) {
    return "returnImportInvoice";
  }

  if (invoiceCode.startsWith("S")) {
    return "salesInvoices";
  }

  if (invoiceCode.startsWith("I")) {
    return "importInvoices";
  }

  return "salesInvoices";
}

const INVOICE_PDF_FONT_FAMILY = "Open Sans";

let invoicePdfFontsRegistered = false;

function resolveInvoicePdfFontSrc(relativePath: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${relativePath}`;
  }

  return relativePath;
}

function registerInvoicePdfFonts(): void {
  if (invoicePdfFontsRegistered) {
    return;
  }

  invoicePdfFontsRegistered = true;

  Font.register({
    family: INVOICE_PDF_FONT_FAMILY,
    fonts: [
      {
        src: resolveInvoicePdfFontSrc("/fonts/OpenSans-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: resolveInvoicePdfFontSrc("/fonts/OpenSans-Bold.ttf"),
        fontWeight: 700,
      },
    ],
  });

  // Avoid hyphenating words; default hyphenation can break Hungarian/Vietnamese glyphs.
  Font.registerHyphenationCallback(function keepWordIntact(word): string[] {
    return [word];
  });
}

registerInvoicePdfFonts();

const sharedPdfStyles = {
  page: {
    padding: 34,
    fontSize: 10,
    color: "#000",
    fontFamily: INVOICE_PDF_FONT_FAMILY,
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
  colIndex: { width: "5%" },
  colSku: { width: "14%" },
  colName: { width: "22%" },
  colUnit: { width: "10%" },
  colQty: { width: "10%" },
  colUnitPrice: { width: "12%" },
  colTotal: { width: "12%" },
  colNote: { width: "15%" },
});

const pdfStylesWithoutNotes = StyleSheet.create({
  ...sharedPdfStyles,
  colIndex: { width: "5%" },
  colSku: { width: "14%" },
  colName: { width: "28%" },
  colUnit: { width: "10%" },
  colQty: { width: "10%" },
  colUnitPrice: { width: "13%" },
  colTotal: { width: "20%" },
});

/** Fixed widths for the first two HTML preview columns (`#`, SKU); other columns use automatic layout. */
const PRINT_PREVIEW_INDEX_COL_WIDTH = "2.5rem";
const PRINT_PREVIEW_SKU_COL_WIDTH = "7.5rem";

type InvoicePdfLabels = {
  title: string;
  invoiceNumber: string;
  status: string;
  statusValue: string;
  by: string;
  date: string;
  confirmedAtFormatted: string;
  sku: string;
  productName: string;
  unit: string;
  quantityLabel: string;
  unitPriceLabel: string;
  totalPriceLabel: string;
  noteLabel: string;
  noNote: string;
};

const PRINT_LOCALE: Record<Lang, string> = {
  en: "en-GB",
  vi: "vi-VN",
  hu: "hu-HU",
};

/**
 * BCP 47 locale tag used for dates and number grouping on printed output.
 *
 * @param lang - App language (`en`, `vi`, or `hu`).
 * @returns Locale string for `Intl` formatters.
 */
function getPrintLocaleTag(lang: Lang): string {
  return PRINT_LOCALE[lang];
}

/**
 * Formats an ISO date string for display using a fixed print locale.
 *
 * @param iso - ISO date string from the API, or null when missing.
 * @param localeTag - Locale passed to `toLocaleDateString`.
 * @returns A short local date, the original string if unparsable, or an em dash when null.
 */
function formatDateForPrintLocale(iso: string | null, localeTag: string): string {
  if (!iso) {
    return "—";
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString(localeTag);
}

/**
 * Builds localized strings for the invoice PDF from a chosen dictionary and locale.
 *
 * @param printDictionary - Dictionary for the selected print language.
 * @param invoice - Invoice payload shown on the PDF.
 * @param localeTag - Locale for date formatting.
 * @returns Label bundle consumed by `InvoicePdfDocument`.
 */
function buildInvoicePdfLabels(
  printDictionary: Dictionary,
  invoice: InvoicePrintData,
  localeTag: string,
): InvoicePdfLabels {
  const titleLabelKey = getInvoiceTitleLabelKey(invoice.invoiceCode);

  return {
    title: printDictionary[titleLabelKey],
    invoiceNumber: printDictionary.invoiceNumber,
    status: printDictionary.status,
    statusValue: printDictionary[invoice.status],
    by: printDictionary.by,
    date: printDictionary.date,
    confirmedAtFormatted: formatDateForPrintLocale(invoice.confirmedAt, localeTag),
    sku: printDictionary.sku,
    productName: printDictionary.productName,
    unit: printDictionary.unit,
    quantityLabel: printDictionary.quantityLabel,
    unitPriceLabel: printDictionary.unitPriceLabel,
    totalPriceLabel: printDictionary.totalPriceLabel,
    noteLabel: printDictionary.noteLabel,
    noNote: printDictionary.noLineNote,
  };
}

function InvoicePdfDocument({
  data,
  labels,
  quantityLocaleTag,
}: {
  data: InvoicePrintData;
  labels: InvoicePdfLabels;
  quantityLocaleTag: string;
}) {
  const hasNotes = Boolean(data.showLineNotes);
  const styles = hasNotes ? pdfStylesWithNotes : pdfStylesWithoutNotes;

  return (
    <Document title={data.invoiceCode}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.title}>{labels.title}</Text>
            <Text style={styles.textSm}>
              {labels.invoiceNumber}: {data.invoiceCode}
            </Text>
            {/* <Text style={styles.textSm}>{labels.status}: {labels.statusValue}</Text> */}
          </View>
          <View>
            {/* <Text style={styles.rightText}>{labels.by}: {data.confirmedBy ?? "—"}</Text> */}
            <Text style={styles.rightText}>
              {labels.date}: {labels.confirmedAtFormatted}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <Text style={[styles.cellHeader, styles.colIndex]}>#</Text>
            <Text style={[styles.cellHeader, styles.colSku]}>{labels.sku}</Text>
            <Text style={[styles.cellHeader, styles.colName]}>{labels.productName}</Text>
            <Text style={[styles.cellHeader, styles.colQty]}>{labels.quantityLabel}</Text>
            <Text style={[styles.cellHeader, styles.colUnit]}>{labels.unit}</Text>
            <Text style={[styles.cellHeader, styles.colUnitPrice, styles.alignRight]}>
              {labels.unitPriceLabel}
            </Text>
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
              <Text style={[styles.cellHeader, pdfStylesWithNotes.colNote, styles.noRightBorder]}>
                {labels.noteLabel}
              </Text>
            )}
          </View>

          {data.lines.map((line, index) => {
            return (
              <View key={`${line.sku}-${index}`} style={styles.tableRow}>
                <Text style={[styles.cell, styles.colIndex]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.colSku]}>{line.sku}</Text>
                <Text style={[styles.cell, styles.colName]}>{line.name}</Text>
                <Text style={[styles.cell, styles.colQty]}>
                  {line.quantity.toLocaleString(quantityLocaleTag)}
                </Text>
                <Text style={[styles.cell, styles.colUnit]}>{line.unit}</Text>
                <Text style={[styles.cell, styles.colUnitPrice, styles.alignRight]}>
                  {formatPriceNumber(line.unitPrice)}
                </Text>
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
          <Text style={styles.totalStrong}>
            {labels.totalPriceLabel}: {formatPriceNumber(data.totalAmount)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default function InvoicePrintPreviewPopup({
  open,
  data,
  onClose,
}: InvoicePrintPreviewPopupProps) {
  const dict = useDict();
  const uiLang = useUiLang();
  const [printLang, setPrintLang] = useState<Lang>(uiLang);

  useEffect(
    function syncPrintLangWhenPopupOpens(): void {
      if (open) {
        setPrintLang(getPrintLangCookie() ?? uiLang);
      }
    },
    [open, uiLang],
  );

  const printLocaleTag = getPrintLocaleTag(printLang);
  const printDictionary = useMemo(
    function resolvePrintDictionary(): Dictionary {
      return getDictionary(printLang);
    },
    [printLang],
  );

  const labels = useMemo(
    function buildPrintLabels(): InvoicePdfLabels {
      return buildInvoicePdfLabels(printDictionary, data, printLocaleTag);
    },
    [printDictionary, data, printLocaleTag],
  );

  async function createInvoicePdfBlob(): Promise<Blob> {
    registerInvoicePdfFonts();

    return pdf(
      <InvoicePdfDocument
        data={data}
        labels={labels}
        quantityLocaleTag={printLocaleTag}
      />,
    ).toBlob();
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
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <h2 className="text-sm font-semibold text-text">{dict.printPreview}</h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Select<Lang>
              ariaLabel={dict.printLanguageLabel}
              icon={
                <Languages
                  aria-hidden
                  strokeWidth={2.25}
                  className="h-3.5 w-3.5 shrink-0"
                />
              }
              value={printLang}
              onChange={setPrintLang}
              className="min-w-[5rem] shrink-0"
              options={[
                { value: "hu", label: dict.langHungarian },
                { value: "en", label: dict.langEnglish },
                { value: "vi", label: dict.langVietnamese },
              ]}
            />
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
                <h3 className="text-xl font-bold">{labels.title}</h3>
                <p className="text-sm">{labels.invoiceNumber}: {data.invoiceCode}</p>
                {/* <p className="text-sm">{labels.status}: {printDictionary[data.status]}</p> */}
              </div>
              <div className="text-right text-sm">
                {/* <p>{labels.by}: {data.confirmedBy ?? "—"}</p> */}
                <p>
                  {labels.date}: {formatDateForPrintLocale(data.confirmedAt, printLocaleTag)}
                </p>
              </div>
            </div>

            <table className="w-full table-auto border border-border text-sm">
              <colgroup>
                <col style={{ width: PRINT_PREVIEW_INDEX_COL_WIDTH }} />
                <col style={{ width: PRINT_PREVIEW_SKU_COL_WIDTH }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="border border-border px-2 py-1 text-left whitespace-nowrap">#</th>
                  <th className="border border-border px-2 py-1 text-left">{labels.sku}</th>
                  <th className="border border-border px-2 py-1 text-left">{labels.productName}</th>
                  <th className="border border-border px-2 py-1 text-left">{labels.quantityLabel}</th>
                  <th className="border border-border px-2 py-1 text-left">{labels.unit}</th>
                  <th className="border border-border px-2 py-1 text-right">{labels.unitPriceLabel}</th>
                  <th className="border border-border px-2 py-1 text-right">{labels.totalPriceLabel}</th>
                  {data.showLineNotes && (
                    <th className="border border-border px-2 py-1 text-left">{labels.noteLabel}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.lines.map(function renderLine(line, index) {
                  return (
                    <tr key={`${line.sku}-${index}`}>
                      <td className="border border-border px-2 py-1 whitespace-nowrap">{index + 1}</td>
                      <td className="border border-border px-2 py-1 break-all">{line.sku}</td>
                      <td className="border border-border px-2 py-1">{line.name}</td>
                      <td className="border border-border px-2 py-1">
                        {line.quantity.toLocaleString(printLocaleTag)}
                      </td>
                      <td className="border border-border px-2 py-1">{line.unit}</td>
                      <td className="border border-border px-2 py-1 text-right">{formatPriceNumber(line.unitPrice)}</td>
                      <td className="border border-border px-2 py-1 text-right">{formatPriceNumber(line.lineTotal)}</td>
                      {data.showLineNotes && (
                        <td className="border border-border px-2 py-1 break-all">
                          {line.notes?.trim() ? line.notes : printDictionary.noLineNote}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <p className="col-span-2 font-semibold">
                {labels.totalPriceLabel}: {formatPriceNumber(data.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Popup>
  );
}
