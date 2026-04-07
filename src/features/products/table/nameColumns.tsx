import Button from "@/components/ui/Buttons";
import type { Column } from "@/components/ui/DataTable";
import { Dictionary } from "@/lib/lang/i18n";
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import { FileText, Settings, Star, Trash2 } from "lucide-react";

type Actions = {
  onRemove: (index: number) => void;
  onMakeDefault: (index: number) => void;
};

export function nameColumns(dict: Dictionary, { onRemove, onMakeDefault }: Actions): Column<string>[] {
  return [
    rowIndexColumn<string>(),

    {
      id: "name",
      header: dict.name,
      icon: <FileText className="h-3.5 w-3.5" />,
      accessor: (n, idx) => (
        <span className={idx === 0 ? "text-gold" : "text-text"}>
          {n}
        </span>
      ),
    },

    {
      id: "action",
      header: dict.action,
      icon: <Settings className="h-3.5 w-3.5" />,
      align: "right",
      accessor: (_, idx) => (
        <div className="flex justify-end gap-1">
          {idx !== 0 && (
            <Button
              onClick={() => onMakeDefault(idx)}
              accent="gold"
            >
              <Star className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Button>
          )}
          <Button
            onClick={() => onRemove(idx)}
            accent="danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      thClassName: "text-right pr-3",
      tdClassName: "text-right pr-3",
    },
  ];
}