"use client";

import React, { useState, useCallback, useMemo } from "react";
import { X, Plus, Barcode, Package, Scale, Warehouse, Ruler, DollarSign, Percent, Calculator, Trash2 } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import { LineItem, DiscountType } from "@/lib/types/domain";

// ===== Types =====
interface InvoiceLineItem extends Omit<LineItem, 'id' | 'productId'> {
  id: string;
  currentStock: number;
}

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: InvoiceFormData) => void;
}

interface InvoiceFormData {
  customerName: string;
  postingAt: string;
  items: InvoiceLineItem[];
  discountType: DiscountType;
  discountValue: number;
  note: string;
  subtotal: number;
  total: number;
}

// ===== Mock Data for Demonstration =====
const mockProducts = [
  { sku: "7600000000123", name: "szatyor", unit: "cs/100db", price: 450, stock: 100 },
  { sku: "7600000000124", name: "szatyor", unit: "cs/100db", price: 450, stock: 2642 },
  { sku: "7600000000125", name: "szatyor", unit: "cs/100db", price: 450, stock: 3482 },
  { sku: "7600000000126", name: "szatyor", unit: "cs/100db", price: 450, stock: 15310 },
];

// ===== Helper Functions =====
function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${date.getMilliseconds().toString().padStart(3, "0")}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

// ===== Main Component =====
export default function AddInvoiceModal({ isOpen, onClose, onSave }: AddInvoiceModalProps) {
  // Form state
  const [customerName, setCustomerName] = useState("");
  const [postingAt] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [discountValue, setDiscountValue] = useState<number>(10);
  
  // Line items state
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: "1", sku: "7600000000123", name: "szatyor", qty: 5, currentStock: 100, unit: "cs/100db", unitPrice: 450, discountPct: 10, total: 2475 },
    { id: "2", sku: "7600000000124", name: "szatyor", qty: 7, currentStock: 2642, unit: "cs/100db", unitPrice: 450, discountPct: 10, total: 3465 },
    { id: "3", sku: "7600000000125", name: "szatyor", qty: 8, currentStock: 3482, unit: "cs/100db", unitPrice: 450, discountPct: 10, total: 3960 },
    { id: "4", sku: "7600000000126", name: "szatyor", qty: 11, currentStock: 15310, unit: "cs/100db", unitPrice: 450, discountPct: 10, total: 5445 },
  ]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      // Calculate line total without discount
      return sum + (item.qty * item.unitPrice);
    }, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (discountType === "PERCENT") {
      return Math.round(subtotal * (discountValue / 100));
    }
    return discountValue;
  }, [subtotal, discountType, discountValue]);

  const total = useMemo(() => {
    return subtotal - discountAmount;
  }, [subtotal, discountAmount]);

  // Handlers
  const handleAddRow = useCallback(() => {
    const newId = (items.length + 1).toString();
    setItems(prev => [...prev, {
      id: newId,
      sku: "",
      name: "",
      qty: 1,
      currentStock: 0,
      unit: "",
      unitPrice: 0,
      discountPct: 0,
      total: 0,
    }]);
  }, [items.length]);

  const handleRemoveRow = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleItemChange = useCallback((id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Recalculate total when qty, unitPrice, or discountPct changes
      if (field === "qty" || field === "unitPrice" || field === "discountPct") {
        const qty = field === "qty" ? Number(value) : item.qty;
        const unitPrice = field === "unitPrice" ? Number(value) : item.unitPrice;
        const discountPct = field === "discountPct" ? Number(value) : (item.discountPct || 0);
        updated.total = Math.round(qty * unitPrice * (1 - discountPct / 100));
      }
      
      return updated;
    }));
  }, []);

  const handleSkuChange = useCallback((id: string, sku: string) => {
    // Look up product by SKU
    const product = mockProducts.find(p => p.sku === sku);
    
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      if (product) {
        const qty = item.qty || 1;
        const discountPct = item.discountPct || 0;
        return {
          ...item,
          sku,
          name: product.name,
          unit: product.unit,
          unitPrice: product.price,
          currentStock: product.stock,
          total: Math.round(qty * product.price * (1 - discountPct / 100)),
        };
      }
      
      return { ...item, sku };
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.({
      customerName,
      postingAt: postingAt.toISOString(),
      items,
      discountType,
      discountValue,
      note,
      subtotal,
      total,
    });
    onClose();
  }, [customerName, postingAt, items, discountType, discountValue, note, subtotal, total, onSave, onClose]);

  // Table columns
  const columns: Column<InvoiceLineItem>[] = useMemo(() => [
    {
      id: "sku",
      header: "SKU",
      icon: <Barcode className="h-3.5 w-3.5" strokeWidth={2} />,
      thClassName: "w-[160px]",
      accessor: (row) => (
        <input
          type="text"
          value={row.sku}
          onChange={(e) => handleSkuChange(row.id, e.target.value)}
          className="w-full bg-transparent outline-none font-semibold dark:font-medium text-neutral-700 dark:text-neutral-200"
          placeholder="Enter SKU..."
        />
      ),
    },
    {
      id: "name",
      header: "Product Name",
      icon: <Package className="h-3.5 w-3.5" strokeWidth={2} />,
      thClassName: "w-[120px]",
      accessor: (row) => (
        <span className="text-neutral-700 dark:text-neutral-200">{row.name || "—"}</span>
      ),
    },
    {
      id: "qty",
      header: "Qty/Weight",
      icon: <Scale className="h-3.5 w-3.5" strokeWidth={2} />,
      thClassName: "w-[90px]",
      align: "center",
      accessor: (row) => (
        <input
          type="number"
          value={row.qty}
          onChange={(e) => handleItemChange(row.id, "qty", parseInt(e.target.value) || 0)}
          className="w-16 bg-transparent outline-none text-center tabular-nums"
          min={0}
        />
      ),
    },
    {
      id: "currentStock",
      header: "Current Stock",
      icon: <Warehouse className="h-3.5 w-3.5" strokeWidth={2} />,
      thClassName: "w-[100px]",
      align: "center",
      accessor: (row) => (
        <span className="tabular-nums text-center text-neutral-500">{formatNumber(row.currentStock)}</span>
      ),
    },
    {
      id: "unit",
      header: "Measuring Unit",
      icon: <Ruler className="h-3.5 w-3.5" strokeWidth={2} />,
      thClassName: "w-[110px]",
      align: "center",
      accessor: (row) => (
        <span className="text-neutral-600 text-center dark:text-neutral-300">{row.unit || "—"}</span>
      ),
    },
    {
      id: "unitPrice",
      header: "Unit Price (HUF)",
      icon: <DollarSign className="h-3.5 w-3.5" strokeWidth={2} />,
      thClassName: "w-[110px]",
      align: "center",
      accessor: (row) => (
        <input
          type="number"
          value={row.unitPrice}
          onChange={(e) => handleItemChange(row.id, "unitPrice", parseInt(e.target.value) || 0)}
          className="w-full bg-transparent outline-none text-center tabular-nums"
          min={0}
        />
      ),
    },
    {
      id: "discountPct",
      header: "Discount (%)",
      icon: <Percent className="h-3.5 w-3.5" strokeWidth={2} />,
      thClassName: "w-[100px]",
      align: "center",
      accessor: (row) => (
        <input
          type="number"
          value={row.discountPct || 0}
          onChange={(e) => handleItemChange(row.id, "discountPct", parseInt(e.target.value) || 0)}
          className="w-full bg-transparent outline-none text-center tabular-nums text-teal-600 dark:text-teal-400"
          min={0}
          max={100}
        />
      ),
    },
    {
      id: "total",
      header: "Total (HUF)",
      icon: <Calculator className="h-3.5 w-3.5" strokeWidth={2} />,
      thClassName: "w-[100px]",
      align: "center",
      accessor: (row) => (
        <span className="tabular-nums text-center font-semibold">{formatNumber(row.total)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      thClassName: "w-[40px]",
      accessor: (row) => (
        <button
          type="button"
          onClick={() => handleRemoveRow(row.id)}
          className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ], [handleSkuChange, handleItemChange, handleRemoveRow]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-neutral-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          {/* Customer Input */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Customer</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="flex-1 px-2 py-1 text-xs outline-none text-neutral-700 dark:text-neutral-200 dark:bg-neutral-900 border rounded-md"
            />
          </div>

          {/* Date and Add Row Button */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Date and Posting Time</span>
              <span className="tabular-nums inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs shadow-sm dark:bg-neutral-900 text-[#6c757d]">
                {formatDateTime(postingAt)}
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs shadow-sm dark:bg-neutral-900 text-[#6c757d] hover:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Row</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <DataTable<InvoiceLineItem>
            columns={columns}
            data={items}
            getRowId={(r) => r.id}
            showIndex
            emptyMessage="No items added. Click 'Add New Row' or scan product barcode to add items."
          />
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="flex gap-6">
            {/* Left Side - Discount & Note */}
            <div className="flex-1 space-y-4">
              {/* Discount */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Discount</span>
                  <RuleInput
                    options={[
                      { label: "Percentage", icon: <Percent className="h-3 w-3" /> },
                      { label: "Amount (HUF)", icon: <DollarSign className="h-3 w-3" /> },
                    ]}
                    rule={discountType === "PERCENT" ? "Percentage" : "Amount (HUF)"}
                    value={discountValue.toString()}
                    placeholder="Enter discount..."
                    onChange={({ rule, value }) => {
                      setDiscountType(rule === "Percentage" ? "PERCENT" : "AMOUNT");
                      setDiscountValue(parseInt(value) || 0);
                    }}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block mb-2">Note</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Leave note here..."
                  className="w-full h-24 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 resize-none"
                />
              </div>
            </div>

            {/* Right Side - Summary */}
            <div className="w-72 space-y-3">
              {/* Sub Total */}
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Sub Total (HUF)</span>
                <span className="tabular-nums text-neutral-800 dark:text-neutral-200">
                  {formatNumber(subtotal)}
                </span>
              </div>

              {/* Discount */}
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Discount
                  <br />
                  <span className="text-xs">
                    ({discountType === "PERCENT" ? `${discountValue}% AT` : "Amount"})
                  </span>
                </span>
                <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
                  {formatNumber(discountAmount)}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">TOTAL</span>
                <span className="text-lg font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                  {formatNumber(total)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-md bg-[#818990] text-sm font-medium text-white hover:bg-[#6e7580] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 h-10 rounded-md bg-[#2a4252] text-sm font-medium text-white hover:bg-[#1f2d3a] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
