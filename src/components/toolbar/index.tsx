"use client";

import { Button } from "@/components/ui/button";

interface ToolbarProps {
  onAction: (action: string) => void;
}

export function Toolbar({ onAction }: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b bg-background p-2">
      {/* Placeholder for future toolbar items */}
    </div>
  );
}