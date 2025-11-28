"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Languages, Sparkles, Spell, FileText, Upload, Download } from "lucide-react";

interface ToolbarProps {
  onAction: (action: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function Toolbar({ onAction, isLoading = false, disabled = false }: ToolbarProps) {
  const handleAction = (action: string) => {
    if (!isLoading && !disabled) {
      onAction(action);
    }
  };

  return (
    <div className="flex items-center gap-2 border-b bg-background p-3">
      {/* File operations */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('import')}
        disabled={isLoading || disabled}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('export')}
        disabled={isLoading || disabled}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Translation operations */}
      <Button
        variant="default"
        size="sm"
        onClick={() => handleAction('translate')}
        disabled={isLoading || disabled}
      >
        <Languages className="mr-2 h-4 w-4" />
        Translate
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleAction('polish')}
        disabled={isLoading || disabled}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Polish
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleAction('fix_spelling')}
        disabled={isLoading || disabled}
      >
        <Spell className="mr-2 h-4 w-4" />
        Fix Spelling
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('batch_all')}
        disabled={isLoading || disabled}
      >
        <FileText className="mr-2 h-4 w-4" />
        Batch All
      </Button>
      
      {isLoading && (
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Processing...
        </div>
      )}
    </div>
  );
}