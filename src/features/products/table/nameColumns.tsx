import Button from "@/components/ui/Buttons";
import type { Column } from "@/components/ui/DataTable";
import IconPill from "@/components/ui/IconPill";
import { Dictionary } from "@/lib/lang/i18n";
import { FileText, Settings, Star, Trash2 } from "lucide-react";

type Actions = {
  onRemove: (index: number) => void;
  onMakeDefault: (index: number) => void;
};

export function nameColumns(dict: Dictionary, { onRemove, onMakeDefault }: Actions): Column<string>[] {
  return [
    {
      id: "name",
      header: dict.name,
      icon: <FileText className="h-3.5 w-3.5" />,
      accessor: (n, idx) => (
        <div className="flex items-center gap-2">
          <span className="text-text">{n}</span>
          {idx === 0 && (
            <IconPill
              icon={Star}
              accent="gold"
            />
          )}
        </div>
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