import { Column } from "@/components/ui/DataTable";
import React from "react";

type ColumnOptions<T> = {
  id?: string;
  header: string;
  icon?: React.ReactNode;
  field?: keyof T;
  accessor?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  thClassName?: string;
  tdClassName?: string;
  width?: string;
};

export function createColumn<T>(options: ColumnOptions<T>): Column<T> {
  return {
    ...options
  };
}