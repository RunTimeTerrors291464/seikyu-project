"use client";

import { Dictionary } from "@/lib/lang/i18n";

export default function ProductHistoryCard({
  dict
}: {
  dict: Dictionary;
}) {
  return (
    <div className="card p-5 space-y-4">

      <h2 className="text-sm font-semibold text-text">
        {dict.history}
      </h2>

      <div className="space-y-3 text-xs text-muted">

        <div>
          <p>{dict.created}</p>
          <span>2024-01-01</span>
        </div>

        <div>
          <p>{dict.lastUpdated}</p>
          <span>2024-01-10</span>
        </div>

        <div>
          <p>{dict.lastTransaction}</p>
          <span>+20 stock</span>
        </div>

      </div>

    </div>
  );
}