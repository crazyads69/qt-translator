"use client";

import { Textarea } from "@/components/ui/textarea";

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function InputPanel({ value, onChange, onBlur }: InputPanelProps) {
  return (
    <div className="flex flex-1 flex-col border-r">
      <div className="border-b bg-muted px-4 py-2">
        <h2 className="text-sm font-semibold">QT Input (Quick Translator)</h2>
        <p className="text-xs text-muted-foreground">Paste your Quick Translator output here</p>
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Paste Quick Translator output here...&#10;&#10;Example:&#10;cừu con cừu con là nữ chủ nhân vật&#10;nam chủ nhân vật là một vị tổng tài&#10;..."
          className="h-full resize-none editor-panel font-mono text-sm"
        />
      </div>
      
      <div className="border-t bg-muted px-4 py-2 text-xs text-muted-foreground">
        {value.split(/\s+/).filter(Boolean).length} words • {value.split("\n").length} lines
      </div>
    </div>
  );
}