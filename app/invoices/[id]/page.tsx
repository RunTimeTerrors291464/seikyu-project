"use client";

import Link from "next/link";
import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { LineItem } from "@/lib/types/domain";

// Status Pill component (reuse from invoices list)
type InvoiceStatus = "Created" | "Cancelled";

function StatusPill({ status }: { status: InvoiceStatus }) {
  const tone =
    status === "Created"
      ? { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" }
      : { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" }; // Cancelled

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-base font-medium ${tone.bg} ${tone.text}`}>
      {status}
    </span>
  );
}

// Info field component
function InfoField({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
        {icon}
        {label}
      </span>
      <div className="text-base font-medium text-neutral-900 dark:text-neutral-100">{children}</div>
    </div>
  );
}

// PDF Preview Component
function InvoicePDFPreview({
  invoiceId,
  customerName,
  createdAt,
  lineItems,
  total,
  pageInfo,
}: {
  invoiceId: string;
  customerName?: string;
  createdAt: string;
  lineItems: LineItem[];
  total: number;
  pageInfo?: { current: number; total: number };
}) {
  // A4 aspect ratio: 210mm x 297mm = 1:1.414
  return (
    <div className="print-area mx-auto aspect-[210/297] h-full max-h-[calc(100vh-9rem)] w-auto rounded bg-white p-8 shadow-lg dark:bg-neutral-800 font-mono text-[0.6vw] overflow-auto print:aspect-auto print:max-h-none print:h-auto print:shadow-none print:rounded-none">
      {/* Page info
      {pageInfo && (
        <div className="mb-4 text-right text-[10px] text-neutral-500">
          {pageInfo.current}. oldal, összesen: {pageInfo.total} oldal
        </div>
      )} */}

      {/* Title */}
      <h2 className="mb-4 text-lg font-bold tracking-wide">ÁRAJÁNLAT</h2>

      {/* Invoice ID and Date */}
      <div className="mb-1 text-[11px] text-neutral-700 dark:text-neutral-300">
        {invoiceId}
      </div>
      <div className="mb-4 text-[11px] text-neutral-700 dark:text-neutral-300">
        {createdAt}
      </div>

      {/* Customer Name */}
      {customerName && (
        <div className="mb-4 text-[11px] text-neutral-700 dark:text-neutral-300">
          {customerName}
        </div>
      )}

      {/* Table */}
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="">
            <th className="border border-neutral-300 dark:border-neutral-600 p-1 text-left font-semibold">Cikkszám</th>
            <th className="border border-neutral-300 dark:border-neutral-600 p-1 text-left font-semibold">Megnevezés</th>
            <th className="border border-neutral-300 dark:border-neutral-600 p-1 text-center font-semibold">Mennyiség</th>
            <th className="border border-neutral-300 dark:border-neutral-600 p-1 text-center font-semibold">Kiszerelés</th>
            <th className="border border-neutral-300 dark:border-neutral-600 p-1 text-right font-semibold">Ár</th>
            <th className="border border-neutral-300 dark:border-neutral-600 p-1 text-right font-semibold">Kedv(%)</th>
            <th className="border border-neutral-300 dark:border-neutral-600 p-1 text-right font-semibold">Érték</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, idx) => {
            const lineTotal = item.qty * item.unitPrice * (1 - (item.discountPct || 0) / 100);
            return (
              <tr key={item.id}>
                <td className="border border-neutral-300 dark:border-neutral-600 p-1 text-left text-neutral-600 dark:text-neutral-400">{item.sku}</td>
                <td className="border border-neutral-300 dark:border-neutral-600 p-1 text-left text-neutral-800 dark:text-neutral-200">{item.name}</td>
                <td className="border border-neutral-300 dark:border-neutral-600 p-1 text-center text-neutral-600 dark:text-neutral-400">{item.qty}</td>
                <td className="border border-neutral-300 dark:border-neutral-600 p-1 text-center text-neutral-600 dark:text-neutral-400">{item.unit}</td>
                <td className="border border-neutral-300 dark:border-neutral-600 p-1 text-right text-neutral-600 dark:text-neutral-400">{item.unitPrice.toLocaleString()}</td>
                <td className="border border-neutral-300 dark:border-neutral-600 p-1 text-right text-neutral-600 dark:text-neutral-400">{item.discountPct || ""}</td>
                <td className="border border-neutral-300 dark:border-neutral-600 p-1 text-right text-neutral-800 dark:text-neutral-200 font-medium">
                  {Math.round(lineTotal).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Total */}
      <div className="mt-6 flex justify-end">
        <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          {total.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [note, setNote] = useState("Bla Bla Bla");

  // Mock line items data
  const mockLineItems: LineItem[] = [
    { id: "1", productId: "7601600413998", sku: "7601600413998", name: "Fa dísztárgy", unit: "db", qty: 2, unitPrice: 700, total: 1400 },
    { id: "2", productId: "7501100307554", sku: "7501100307554", name: "Fa dísztárgy", unit: "db", qty: 3, unitPrice: 530, total: 1590 },
    { id: "3", productId: "7601600413981", sku: "7601600413981", name: "Fa dísztárgy", unit: "db", qty: 3, unitPrice: 700, total: 2100 },
    { id: "4", productId: "60", sku: "60", name: "fa dísztárgy", unit: "db", qty: 3, unitPrice: 700, total: 2100 },
    { id: "5", productId: "253767", sku: "253767", name: "uzsonnattasak 17*25", unit: "cs", qty: 10, unitPrice: 130, total: 1300 },
    { id: "6", productId: "666", sku: "666", name: "szatyor", unit: "cs/100db", qty: 2, unitPrice: 450, total: 900 },
    { id: "7", productId: "24", sku: "24", name: "Bizsu nyaklánc", unit: "db", qty: 21, unitPrice: 150, total: 3150 },
    { id: "8", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 4, unitPrice: 600, total: 2400 },
    { id: "9", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 2, unitPrice: 500, total: 1000 },
    { id: "10", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 36, unitPrice: 230, total: 8280 },
    { id: "11", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 5, unitPrice: 300, total: 1500 },
    { id: "12", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 9, unitPrice: 500, total: 4500 },
    { id: "13", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 2, unitPrice: 570, total: 1140 },
    { id: "14", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 2, unitPrice: 50, total: 100 },
    { id: "15", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 5, unitPrice: 600, total: 3000 },
    { id: "16", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 4, unitPrice: 400, total: 1600 },
    { id: "17", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 2, unitPrice: 560, total: 1120 },
    { id: "18", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 1, unitPrice: 450, total: 450 },
    { id: "19", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 2, unitPrice: 420, total: 840 },
    { id: "20", productId: "16", sku: "16", name: "Ásvány karkötő", unit: "db", qty: 5, unitPrice: 470, total: 2350 },
    { id: "21", productId: "19", sku: "19", name: "ásvány nyaklánc", unit: "db", qty: 9, unitPrice: 350, total: 3150 },
    { id: "22", productId: "26", sku: "26", name: "Bizsualkatrész", unit: "db", qty: 5, unitPrice: 300, total: 1500 },
    { id: "23", productId: "7", sku: "7", name: "Ragasztó", unit: "db", qty: 1, unitPrice: 500, total: 500 },
    { id: "24", productId: "7601600614302", sku: "7601600614302", name: "WC kefe tartó", unit: "db", qty: 1, unitPrice: 370, total: 370 },
  ];

  // Mock data - replace with actual data fetching
  const invoice = {
    id,
    number: `${id.padStart(5, "0")}`,
    status: "Created" as InvoiceStatus,
    customerName: "Danh Phan",
    datePosting: "2025-10-15 01:22:33.678",
    createdAt: "11.09.2025",
    inputInRE: true,
    subtotal: 51489,
    discountPercent: 10,
    total: 46340,
    note: "Bla Bla Bla",
    lineItems: mockLineItems,
  };

  return (
    <div className="flex grow flex-col space-y-6 min-h-0 print:block">
      {/* Header */}
      <div className="print:hidden">
        <PageHeader
          title={`Invoice ${invoice.number}`}
          backHref="/invoices"
          actions={
            <>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
              <button className="rounded-md border border-orange-400 bg-white px-4 py-1.5 text-sm font-medium text-orange-500 transition-colors hover:bg-orange-50 dark:border-orange-500 dark:bg-neutral-900 dark:text-orange-400 dark:hover:bg-orange-950">
                Cancel
              </button>
            </>
          }
        />
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 overflow-hidden gap-4 print:block">
        {/* Left Panel - Invoice Details */}
        <div className="flex w-full flex-col overflow-y-auto rounded-lg border border-r border-neutral-200 p-6 dark:border-neutral-800 lg:w-2/3 bg-white print:hidden">
          {/* Info Grid - Status, Date, Input, SubTotal, Discount */}
          <div className="grid grid-cols-3 gap-x-6 gap-y-8">
            <InfoField
              icon={<span className="text-neutral-400">⊙</span>}
              label="Status"
            >
              <StatusPill status={invoice.status} />
            </InfoField>

            <InfoField
              icon={<span className="text-neutral-400">◷</span>}
              label="Date & Posting Time"
            >
              {invoice.datePosting}
            </InfoField>

            <InfoField
              icon={<span className="text-neutral-400">⊕</span>}
              label="Input in Revol Express"
            >
              {invoice.inputInRE ? "Yes" : "No"}
            </InfoField>

            <InfoField
              icon={<span className="text-neutral-400">⊙</span>}
              label="Sub Total"
            >
              <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {invoice.subtotal.toLocaleString()} HUF
              </span>
              {/* $ {invoice.subtotal.toLocaleString()} */}
            </InfoField>

            <InfoField
              icon={<span className="text-neutral-400">%</span>}
              label="Discount (AT)"
            >
              {invoice.discountPercent}%
            </InfoField>
          </div>

          {/* Divider */}
          <hr className="mt-8 border-neutral-200 dark:border-neutral-700" />

          {/* Total */}
          <div className="mt-6">
            <div className="flex items-center gap-1.5 text-xs text-blue-500">
              <span>∑</span>
              <span>Total</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {invoice.total.toLocaleString()} HUF
            </div>
          </div>

          {/* Note Section */}
          <div className="mt-auto pt-8">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                <span>≡</span>
                Note
              </label>
              <button className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
                Save
              </button>
            </div>
            <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
              <textarea
                className="min-h-[80px] w-full resize-none bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
              />
            </div>
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="hidden w-full flex-col overflow-hidden bg-neutral-100 p-0 dark:bg-neutral-950 lg:flex lg:w-1/2 print:block print:w-full print:bg-white print:p-0">
          <div className="print-area-container flex h-full items-center justify-center overflow-auto rounded-lg border border-neutral-200 bg-[#525659] p-0 shadow-sm dark:border-neutral-800 print:block print:bg-white print:border-none print:shadow-none print:rounded-none print:p-0">
              <InvoicePDFPreview
                invoiceId={`6389318346479208B1`}
                customerName={invoice.customerName}
                createdAt={invoice.createdAt}
                lineItems={invoice.lineItems}
                total={invoice.total}
                pageInfo={{ current: 1, total: 1 }}
              />
          </div>
        </div>
      </div>
    </div>
  );
}
