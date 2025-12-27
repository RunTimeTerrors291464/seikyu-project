import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  actions?: React.ReactNode;
  className?: string;
  backHref?: string;
};

export default function PageHeader({ title, actions, className, backHref }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      {backHref ? (
        <Link
          href={backHref}
          className="flex items-center gap-2 text-xl font-semibold text-neutral-900 transition-colors hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{title}</span>
        </Link>
      ) : (
        <h1 className="text-xl font-semibold">{title}</h1>
      )}
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
