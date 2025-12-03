import type { ReactNode } from "react";

import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectOption = {
  value: string | number;
  label: ReactNode;
};

interface SelectProps {
  id?: string;
  value?: string | number | null;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  required,
}: SelectProps) {
  const normalizedValue = value === null || value === undefined ? "" : String(value);
  const shadValue = normalizedValue === "" ? undefined : normalizedValue;
  const finalPlaceholder = placeholder ?? options[0]?.label ?? "Select an option";

  return (
    <ShadSelect
      value={shadValue}
      onValueChange={(val) => onChange?.(val)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className} aria-required={required}>
        <SelectValue placeholder={finalPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadSelect>
  );
}
