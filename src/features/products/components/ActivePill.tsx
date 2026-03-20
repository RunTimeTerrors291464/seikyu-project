"use client";

import IconPill from "@/components/ui/IconPill";
import { useDict } from "@/lib/lang/DictProvider";
import { CheckCircle2, XCircle } from "lucide-react";

type Props = {
  active: boolean;
};

export default function ActivePill({
  active,
}: Props) {
  const dict = useDict()

  return (
    <IconPill
      icon={active ? CheckCircle2 : XCircle}
      accent={active ? "success" : "neutral"}
      label={active ? dict.active : dict.inactive}
    />
  );
}