import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmissionFactor } from "@/lib/mock-data";
import { sortFactorsForLine } from "@/lib/factor-suggest";

type EmissionFactorSelectProps = {
  factors: EmissionFactor[];
  line: { description: string; category: string; unit: string };
  value?: string;
  selectedName?: string;
  disabled?: boolean;
  onValueChange: (factorId: string, factor: EmissionFactor | undefined) => void;
};

export function EmissionFactorSelect({
  factors,
  line,
  value,
  selectedName,
  disabled,
  onValueChange,
}: EmissionFactorSelectProps) {
  const sorted = useMemo(() => sortFactorsForLine(factors, line), [factors, line]);
  const selected = sorted.find((f) => f.id === value) ?? factors.find((f) => f.id === value);

  return (
    <Select
      value={value || undefined}
      disabled={disabled}
      onValueChange={(id) => onValueChange(id, factors.find((f) => f.id === id))}
    >
      <SelectTrigger className="h-8 w-56">
        <SelectValue placeholder="Select factor">
          {selected?.name ?? selectedName ?? "Select factor"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4} className="max-h-72 z-[200]">
        {sorted.map((f) => (
          <SelectItem key={f.id} value={f.id} className="text-xs">
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
