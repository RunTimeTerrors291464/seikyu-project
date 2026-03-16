"use client";

import Tooltip from "@/components/ui/ToolTips";
import clsx from "clsx";
import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  onClick?: () => void;
  tooltip?: string;
  className?: string;
};

export default function IconButton({
  icon,
  onClick,
  tooltip,
  className
}: Props) {

  const button = (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center",
        "rounded-md border border-border bg-card p-1.5",
        "text-muted transition-colors",
        "hover:bg-border hover:text-text",
        className
      )}
    >
      {icon}
    </button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip content={tooltip}>
      {button}
    </Tooltip>
  );
}