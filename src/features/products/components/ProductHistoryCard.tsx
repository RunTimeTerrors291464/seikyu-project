"use client";

import Button from "@/components/ui/Buttons";
import { useDict } from "@/lib/lang/DictProvider";
import { ArrowDown, ArrowUp, History } from "lucide-react";
import { useState } from "react";
import { ProductHistoryDetail, ProductHistoryItem } from "../types/product";
import HistoryGroupRow from "./HistoryGroupRow";

type Props = {
  history: ProductHistoryItem[];
  loading: boolean;
  detailMap: Record<number, ProductHistoryDetail>;
  loadingMap: Record<number, boolean>;
  fetchDetail: (version: number) => void;
};

export default function ProductHistoryCard({
  history,
  loading,
  detailMap,
  loadingMap,
  fetchDetail,
}: Props) {
  const dict = useDict();

  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const sorted = [...history].sort((a, b) =>
    order === "asc"
      ? new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
          <History className="h-4 w-4 text-muted" />
          {dict.history}
        </h2>

        <Button
          onClick={() =>
            setOrder((o) => (o === "asc" ? "desc" : "asc"))
          }
          icon={
            order === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          }
        >
          {order === "asc" ? dict.oldest : dict.newest}
        </Button>
      </div>

      {/* BODY */}
      <div className="overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="text-xs text-muted">
            {dict.loading}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-xs text-muted">
            {dict.noHistory}
          </div>
        ) : (
          sorted.map((group, index) => (
            <HistoryGroupRow
              key={group.id}
              group={group}
              isLast={index === sorted.length - 1}
              detailMap={detailMap}
              loadingMap={loadingMap}
              fetchDetail={fetchDetail}
            />
          ))
        )}
      </div>
    </div>
  );
}