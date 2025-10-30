import React from "react";

type PageHeaderProps = {
  title: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <h1 className="text-xl font-semibold">{title}</h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
