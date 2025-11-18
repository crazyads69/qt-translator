"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Highlighter, Replace } from "lucide-react";

interface OutputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  highlightedWords: Set<string>;
  onHighlight: (word: string) => void;
  onReplace: (oldWord: string, newWord: string) => void;
}

export function OutputPanel({
  value,
  onChange,
  onBlur,
  highlightedWords,
  onHighlight,
  onReplace,
}: OutputPanelProps) {
  const [selectedText, setSelectedText] = useState("");
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [replacementText, setReplacementText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContextMenu = () => {
    if (textareaRef.current) {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text) {
        setSelectedText(text);
      }
    }
  };

  const handleHighlight = () => {
    if (selectedText) {
      onHighlight(selectedText);
    }
  };

  const handleReplaceClick = () => {
    setReplacementText("");
    setShowReplaceDialog(true);
  };

  const handleReplaceConfirm = () => {
    if (selectedText && replacementText) {
      onReplace(selectedText, replacementText);
      setShowReplaceDialog(false);
      setSelectedText("");
      setReplacementText("");
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getHighlightedText = () => {
    if (highlightedWords.size === 0) return value;

    let result = value;
    highlightedWords.forEach((word) => {
      const regex = new RegExp(`\\b(${word})\\b`, "gi");
      result = result.replace(regex, '<mark class="highlighted-word">$1</mark>');
    });
    return result;
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="border-b bg-muted px-4 py-2">
          <h2 className="text-sm font-semibold">Vietnamese Output</h2>
          <p className="text-xs text-muted-foreground">
            Edit and refine your translation • Right-click for options
          </p>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <ContextMenu>
            <ContextMenuTrigger>
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                onContextMenu={handleContextMenu}
                placeholder="Translated Vietnamese text will appear here...&#10;&#10;You can:&#10;• Edit the text manually&#10;• Right-click on any word for options&#10;• Use the buttons below to translate/polish"
                className="h-full resize-none editor-panel font-mono text-sm"
              />
            </ContextMenuTrigger>

            <ContextMenuContent>
              {selectedText && (
                <>
                  <ContextMenuItem onClick={handleReplaceClick}>
                    <Replace className="mr-2 h-4 w-4" />
                    Quick Replace
                  </ContextMenuItem>

                  <ContextMenuItem onClick={handleHighlight}>
                    <Highlighter className="mr-2 h-4 w-4" />
                    {highlightedWords.has(selectedText)
                      ? "Remove Highlight"
                      : "Highlight Word"}
                  </ContextMenuItem>

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    onClick={() =>
                      openExternalLink(
                        `https://hvdic.thivien.net/whv/${encodeURIComponent(
                          selectedText
                        )}`
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Hán Việt Dictionary
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() =>
                      openExternalLink(
                        `https://translate.google.com/?sl=vi&tl=en&text=${encodeURIComponent(
                          selectedText
                        )}`
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Google Translate
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() =>
                      openExternalLink(
                        `https://baike.baidu.com/item/${encodeURIComponent(
                          selectedText
                        )}`
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Baidu Baike
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() =>
                      openExternalLink(
                        `https://rung.vn/search/${encodeURIComponent(
                          selectedText
                        )}`
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Rung.vn Dictionary
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        </div>

        <div className="border-t bg-muted px-4 py-2 text-xs text-muted-foreground">
          {value.split(/\s+/).filter(Boolean).length} words • {value.split("\n").length} lines
          {highlightedWords.size > 0 && ` • ${highlightedWords.size} highlighted`}
        </div>
      </div>

      {/* Replace Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Replace</DialogTitle>
            <DialogDescription>
              Replace all occurrences of &quot;{selectedText}&quot; with:
            </DialogDescription>
          </DialogHeader>

          <Input
            value={replacementText}
            onChange={(e) => setReplacementText(e.target.value)}
            placeholder="Enter replacement text..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleReplaceConfirm();
              }
            }}
            autoFocus
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplaceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReplaceConfirm} disabled={!replacementText}>
              Replace All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}