"use client";

import {
  ArrowLeft,
  Save
} from "lucide-react";
import Link from "next/link";

import Button from "@/components/ui/Buttons";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useDict } from "@/lib/lang/DictProvider";

type Props = {
  name: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  onToggleActive: () => void;
  onSave?: () => void;
};

export default function ProductHeader({
  name,
  createdAt,
  updatedAt,
  active,
  onToggleActive,
  onSave,
}: Props) {
  const dict = useDict();

  return (
    <div className="flex items-center justify-between">
      {/* Left */}
      <Link
        href="/manager/product-inventory"
        className="flex items-center gap-2 text-xl font-semibold text-text hover:text-muted"
      >
        <ArrowLeft className="h-5 w-5" />
        {name}
      </Link>

      {/* Right */}
      <div className="flex items-center gap-2">
        <HeaderMeta label={dict.createdAt} value={createdAt} />
        <HeaderMeta label={dict.updatedAt} value={updatedAt} />

        <StatusToggle
          active={active}
          onClick={onToggleActive}
          activeLabel={dict.active}
          inactiveLabel={dict.inactive}
        />

        <Button
          onClick={onSave}
          accent="primary"
          icon={<Save className="h-3.5 w-3.5" />}
        >
          {dict.save}
        </Button>

      </div>
    </div>
  );
}