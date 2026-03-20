"use client";

import Button from "@/components/ui/Buttons";
import { useDict } from "@/lib/lang/DictProvider";
import { ArrowDown, ArrowUp, History } from "lucide-react";
import { useState } from "react";
import { useProductHistory } from "../hooks/useProductHistory";
import HistoryGroupRow from "./HistoryGroupRow";

type Props = {
  productId: string;
};

export default function ProductHistoryCard({
  productId,
}: Props) {

  const dict = useDict()

  const { history, loading } =
    useProductHistory(productId);

  const [order, setOrder] =
    useState<"asc" | "desc">("desc");

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
          History
        </h2>

        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              setOrder((o) =>
                o === "asc" ? "desc" : "asc"
              )
            }
            icon={
              order === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )
            }
          >
            {order === "asc" ? "Oldest" : "Newest"}
          </Button>
        </div>
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
          <div className="space-y-0">
            {sorted.map((group, index) => (
              <HistoryGroupRow
                key={group.id}
                group={group}
                productId={productId}
                isLast={index === sorted.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}