"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Save, Loader2, FileText, Languages, Sparkles, CheckCircle, RotateCcw, Copy, Upload, Download, Keyboard, ExternalLink, Search, Replace, Highlighter, Layers, AlertTriangle, Clock, TrendingUp, Edit3, X } from "lucide-react";
import { toast } from "sonner";

interface Chapter {
  number: number;
  title: string;
  description?: string;
  qtInput?: string;
  viOutput?: string;
  wordCount?: number;
  status?: "not-started" | "in-progress" | "completed";
}

interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  content: {
    qtInput: string;
    viOutput: string;
  };
  metadata: {
    description?: string;
    chapters?: Chapter[];
    chapter?: number;
    progress?: number;
    wordCount?: number;
    status?: "in-progress" | "completed";
    version?: string;
  };
}

interface ChapterTranslatePageProps {
  params: Promise<{ id: string; chapterNumber: string }>;
}

interface TranslationPreview {
  original: string;
  translated: string;
  position: { start: number; end: number };
  confidence?: number;
  suggestions?: string[];
  context?: {
    before: string;
    after: string;
  };
}

interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  original: string;
  translated: string;
  action: string;
  confidence?: number;
}

export default function ChapterTranslatePage({ params }: ChapterTranslatePageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const resolvedParams = use(params);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Project and chapter state
  const [project, setProject] = useState<Project | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Content state
  const [qtInput, setQtInput] = useState("");
  const [viOutput, setViOutput] = useState("");
  
  // Translation preview state
  const [translationPreview, setTranslationPreview] = useState<TranslationPreview | null>(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  
  // Translation history and sidebar
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryItem[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<string>("");
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Context menu and highlighting state
  const [selectedText, setSelectedText] = useState("");
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [replaceText, setReplaceText] = useState("");
  
  // Word count calculations
  const viWordCount = viOutput.trim() ? viOutput.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  const viLineCount = viOutput.split('\n').length;

  // Get context around selection
  const getTranslationContext = useCallback((start: number, end: number, text: string) => {
    const contextSize = 200;
    const before = text.substring(Math.max(0, start - contextSize), start);
    const after = text.substring(end, Math.min(text.length, end + contextSize));
    return { before, after };
  }, []);

  // Calculate translation confidence (mock - you can enhance this based on API response)
  const calculateConfidence = useCallback((original: string, translated: string): number => {
    // Simple heuristic: longer translations with more words tend to be more confident
    // In production, this should come from your AI API
    const originalLength = original.length;
    const translatedLength = translated.length;
    const ratio = translatedLength / originalLength;
    
    if (ratio > 0.5 && ratio < 3) {
      return Math.min(0.95, 0.7 + (Math.random() * 0.25));
    }
    return 0.6 + (Math.random() * 0.2);
  }, []);

  // Add to translation history
  const addToHistory = useCallback((item: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: TranslationHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    
    setTranslationHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20
  }, []);

  // Preserve text selection after operations
  const preserveTextSelection = useCallback(() => {
    if (!textareaRef.current || !selectedText) return;
    
    const start = parseInt(textareaRef.current.dataset.selectionStart || '0');
    const end = parseInt(textareaRef.current.dataset.selectionEnd || '0');
    
    setTimeout(() => {
      if (textareaRef.current && start !== end) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, end);
      }
    }, 100);
  }, [selectedText]);

  // Enhanced translation function with preview and context
  const handleTranslateSelected = useCallback(async (action: "translate" | "polish" | "fix_spelling" = "translate") => {
    if (!selectedText.trim()) {
      toast.error("Please select text to translate");
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const context = getTranslationContext(start, end, viOutput);
    
    try {
      setIsTranslating(true);

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: selectedText,
          context: action === "translate" ? context : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result) {
        const confidence = calculateConfidence(selectedText, data.result);
        
        // Set current translation and show sidebar
        setCurrentTranslation(data.result);
        setShowSidebar(true);
        
        // Add to history
        addToHistory({
          original: selectedText,
          translated: data.result,
          action,
          confidence
        });
        
        toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} completed! Use sidebar to copy translation.`);
        
        // Preserve text selection
        preserveTextSelection();
      }
    } catch (error) {
      console.error(`Translation error (${action}):`, error);
      toast.error(error instanceof Error ? error.message : `${action} failed`);
    } finally {
      setIsTranslating(false);
    }
  }, [selectedText, viOutput, getTranslationContext, calculateConfidence, addToHistory, preserveTextSelection]);

  // Copy translation to clipboard
  const copyTranslation = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Translation copied to clipboard! You can now paste it manually.");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy translation");
    }
  }, []);

  // Copy translation from history
  const copyFromHistory = useCallback(async (item: TranslationHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.translated);
      toast.success("Translation from history copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy translation");
    }
  }, []);

  // Legacy translation function for polish and fix_spelling (full text)
  const handleTranslate = useCallback(async (action: "polish" | "fix_spelling") => {
    if (!viOutput.trim()) {
      toast.error("Please have Vietnamese text to improve");
      return;
    }
    
    try {
      setIsTranslating(true);

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          text: viOutput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result) {
        // Show result in sidebar for preview
        setCurrentTranslation(data.result);
        setShowSidebar(true);
        
        // Add to history
        const confidence = calculateConfidence(viOutput, data.result);
        addToHistory({
          original: viOutput.substring(0, 100) + (viOutput.length > 100 ? '...' : ''), // Truncate for display
          translated: data.result,
          action,
          confidence
        });
        
        toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} completed! Review in sidebar and copy to replace manually.`);
      } else {
        throw new Error("No translation received");
      }

    } catch (error) {
      console.error(`Translation error (${action}):`, error);
      const message = error instanceof Error ? error.message : `${action} failed`;
      toast.error(message);
    } finally {
      setIsTranslating(false);
    }
  }, [viOutput, calculateConfidence, addToHistory]);

  // Save chapter function
  const handleSaveChapter = useCallback(async () => {
    if (!project || !chapter) return;

    try {
      setIsSaving(true);

      const updatedChapter: Chapter = {
        ...chapter,
        qtInput,
        viOutput,
        wordCount: viWordCount,
        status: viOutput.trim() ? "completed" : qtInput.trim() ? "in-progress" : "not-started"
      };

      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...project.metadata,
          chapters: project.metadata.chapters?.map(ch => 
            ch.number === chapter.number ? updatedChapter : ch
          ) || [updatedChapter]
        }
      };

      const response = await fetch("/api/r2/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          project: updatedProject,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setProject(updatedProject);
      setChapter(updatedChapter);
      setUnsavedChanges(false);
      toast.success("Chapter saved successfully!");

    } catch (error) {
      console.error("Error saving chapter:", error);
      toast.error("Failed to save chapter");
    } finally {
      setIsSaving(false);
    }
  }, [project, chapter, qtInput, viOutput, viWordCount]);

  // Track changes
  useEffect(() => {
    setUnsavedChanges(true);
  }, [qtInput, viOutput]);

  // Auto-save functionality
  useEffect(() => {
    if (!chapter || !project || !unsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      if (qtInput.trim() || viOutput.trim()) {
        handleSaveChapter();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [qtInput, viOutput, chapter, project, unsavedChanges, handleSaveChapter]);

  // Save on blur
  const handleBlur = () => {
    if (unsavedChanges && (qtInput.trim() || viOutput.trim())) {
      handleSaveChapter();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSaveChapter();
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault();
        if (selectedText.trim()) {
          handleTranslateSelected();
        } else {
          toast.info("Select text first to translate");
        }
      }

      // ESC to close sidebar
      if (event.key === 'Escape' && showSidebar) {
        setShowSidebar(false);
        setCurrentTranslation("");
      }

      // Ctrl+C to copy current translation
      if (event.key === 'c' && showSidebar && currentTranslation && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        copyTranslation(currentTranslation);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveChapter, handleTranslateSelected, selectedText, showSidebar, currentTranslation, copyTranslation]);

  // Intercept default right-click menu globally
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInTranslationArea = target.closest('textarea') || 
                                  target.closest('[data-translation-area]');
      
      if (isInTranslationArea) {
        event.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Before unload protection
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (unsavedChanges && (qtInput.trim() || viOutput.trim())) {
        handleSaveChapter();
        
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges, qtInput, viOutput, handleSaveChapter]);

  // Load project and chapter data
  useEffect(() => {
    const loadProjectAndChapter = async () => {
      if (!session) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/r2/load?projectId=${resolvedParams.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Project not found");
          }
          throw new Error("Failed to load project");
        }

        const data = await response.json();
        setProject(data.project);

        const chapterNumber = parseInt(resolvedParams.chapterNumber);
        const foundChapter = data.project.metadata?.chapters?.find(
          (ch: Chapter) => ch.number === chapterNumber
        );

        if (!foundChapter) {
          setError(`Chapter ${chapterNumber} not found`);
          return;
        }

        setChapter(foundChapter);
        setQtInput(foundChapter.qtInput || "");
        setViOutput(foundChapter.viOutput || "");
        setUnsavedChanges(false);
        
      } catch (error) {
        console.error("Error loading project:", error);
        setError(error instanceof Error ? error.message : "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    if (resolvedParams?.id && resolvedParams?.chapterNumber) {
      loadProjectAndChapter();
    }
  }, [session, resolvedParams.id, resolvedParams.chapterNumber]);

  // Quick replace functionality
  const handleQuickReplace = async () => {
    if (!selectedText || !replaceText) return;

    const escapedText = selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newViOutput = viOutput.replace(new RegExp(escapedText, 'g'), replaceText);
    setViOutput(newViOutput);
    setShowReplaceDialog(false);
    setReplaceText("");
    
    toast.success(`Replaced all occurrences of "${selectedText}" with "${replaceText}"`);
  };

  // Highlight word functionality
  const toggleHighlight = (word: string) => {
    const newHighlighted = new Set(highlightedWords);
    if (newHighlighted.has(word)) {
      newHighlighted.delete(word);
      toast.info(`Removed highlight from "${word}"`);
    } else {
      newHighlighted.add(word);
      toast.success(`Highlighted "${word}"`);
    }
    setHighlightedWords(newHighlighted);
  };

  // Handle text selection and preserve selection state
  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start !== end) {
      const selected = textareaRef.current.value.substring(start, end).trim();
      if (selected) {
        setSelectedText(selected);
        // Store selection position for preservation
        textareaRef.current.dataset.selectionStart = start.toString();
        textareaRef.current.dataset.selectionEnd = end.toString();
      }
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("File downloaded successfully");
  };

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(`${type} copied to clipboard`);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !project || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Error Loading Chapter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || "Chapter not found"}
            </p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{chapter.title}</h1>
              <p className="text-muted-foreground">Chapter {chapter.number} - {project.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={showSidebar ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Translation Sidebar {translationHistory.length > 0 && `(${translationHistory.length})`}
            </Button>

            <Badge variant={chapter.status === "completed" ? "default" : chapter.status === "in-progress" ? "secondary" : "outline"}>
              {chapter.status === "completed" ? "Completed" : 
               chapter.status === "in-progress" ? "In Progress" : 
               "Not Started"}
            </Badge>
            
            <Button 
              onClick={handleSaveChapter}
              disabled={isSaving || !unsavedChanges}
              variant={unsavedChanges ? "default" : "outline"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>





        {/* Main Content Area with Sidebar */}
        <div className="grid grid-cols-12 gap-4">
          {/* Main Translation Panel */}
          <div className={`${showSidebar ? 'col-span-8' : 'col-span-12'} transition-all duration-300`}>
            <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Translation Editor
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(viOutput, "Translation text")}
                  disabled={!viOutput.trim()}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(viOutput, `${chapter.title}-translation.txt`)}
                  disabled={!viOutput.trim()}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.txt';
                    input.addEventListener('change', (e) => {
                      const target = e.target as HTMLInputElement;
                      const file = target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          setViOutput(content);
                          toast.success('File uploaded successfully');
                        };
                        reader.onerror = () => toast.error('Failed to read file');
                        reader.readAsText(file, 'utf-8');
                      }
                    });
                    input.click();
                  }}
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              Paste Chinese text, select sentences/paragraphs, right-click to translate • Use sidebar to copy translations manually
            </CardDescription>
          </CardHeader>
          <CardContent data-translation-area>
            <ContextMenu>
              <ContextMenuTrigger>
                <Textarea
                  ref={textareaRef}
                  value={viOutput}
                  onChange={(e) => setViOutput(e.target.value)}
                  onBlur={handleBlur}
                  onSelect={handleTextSelection}
                  onMouseUp={handleTextSelection}
                  placeholder="Paste Chinese text here and start translating by selecting text and right-clicking..."
                  className="min-h-[500px] resize-none text-lg leading-relaxed font-serif whitespace-pre-wrap"
                  data-translation-area
                  disabled={isTranslating}
                  style={{
                    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                    lineHeight: '1.8',
                    padding: '20px',
                  }}
                />
              </ContextMenuTrigger>
              <ContextMenuContent>
                {selectedText ? (
                  <>
                    <ContextMenuItem onClick={() => {
                      handleTranslateSelected("translate");
                    }} disabled={isTranslating}>
                      <Languages className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>{isTranslating ? "Translating..." : "Translate Selected"}</span>
                        <span className="text-xs text-muted-foreground">Ctrl+T</span>
                      </div>
                    </ContextMenuItem>
                    
                    <ContextMenuItem onClick={() => {
                      navigator.clipboard.writeText(selectedText);
                      toast.success("Copied to clipboard");
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </ContextMenuItem>
                    
                    <ContextMenuItem onClick={() => setShowReplaceDialog(true)}>
                      <Replace className="mr-2 h-4 w-4" />
                      Quick Replace &quot;{selectedText.substring(0, 20)}{selectedText.length > 20 ? '...' : ''}&quot;
                    </ContextMenuItem>
                    
                    <ContextMenuItem onClick={() => toggleHighlight(selectedText)}>
                      <Highlighter className="mr-2 h-4 w-4" />
                      {highlightedWords.has(selectedText) ? 'Remove Highlight' : 'Highlight Word'}
                    </ContextMenuItem>
                    
                    <Separator />
                    
                    <ContextMenuItem onClick={() => handleTranslate("polish")} disabled={isTranslating || !viOutput.trim()}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Polish Full Text
                    </ContextMenuItem>
                    
                    <ContextMenuItem onClick={() => handleTranslate("fix_spelling")} disabled={isTranslating || !viOutput.trim()}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Fix Spelling
                    </ContextMenuItem>
                  </>
                ) : (
                  <>
                    <ContextMenuItem onClick={() => { setViOutput(""); toast.success("Text cleared"); }} disabled={isTranslating || isSaving}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear All
                    </ContextMenuItem>
                    <ContextMenuItem disabled>
                      <Search className="mr-2 h-4 w-4" />
                      Select text to see options
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
            <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{viWordCount} words</span>
                <span>{viLineCount} lines</span>
                {highlightedWords.size > 0 && (
                  <span className="text-yellow-600">
                    <Highlighter className="w-3 h-3 inline mr-1" />
                    {highlightedWords.size} highlighted
                  </span>
                )}
                {isTranslating && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Translating...
                  </span>
                )}
              </div>
              {unsavedChanges && (
                <span className="text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Unsaved changes
                </span>
              )}
            </div>
          </CardContent>
            </Card>
          </div>

          {/* Translation Sidebar */}
          {showSidebar && (
            <div className="col-span-4">
              <Card className="sticky top-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Languages className="w-5 h-5 text-blue-500" />
                      Translation Center
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSidebar(false);
                        setCurrentTranslation("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    Copy translations manually • <kbd>Ctrl+C</kbd> to copy current • <kbd>Esc</kbd> to close
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Translation */}
                  {currentTranslation && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Current Translation</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyTranslation(currentTranslation)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm border-2 border-blue-200 dark:border-blue-800 max-h-[300px] overflow-y-auto">
                        {currentTranslation}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {currentTranslation.length > 200 
                          ? "Full text translation - copy and replace entire content"
                          : "Select text in editor and paste to replace"
                        }
                      </div>
                    </div>
                  )}

                  {/* Translation History */}
                  {translationHistory.length > 0 && (
                    <div>
                      <Separator />
                      <div className="pt-4">
                        <Label className="text-sm font-medium mb-3 block">
                          Translation History ({translationHistory.length})
                        </Label>
                        <ScrollArea className="h-[400px] pr-3">
                          <div className="space-y-3">
                            {translationHistory.map((item) => (
                              <div
                                key={item.id}
                                className="p-3 border rounded-lg hover:bg-accent transition-colors group"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {item.action}
                                    </Badge>
                                    {item.confidence && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs"
                                      >
                                        {(item.confidence * 100).toFixed(0)}%
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => copyFromHistory(item)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="text-muted-foreground line-clamp-1 font-mono text-[10px]">
                                    {item.original}
                                  </div>
                                  <div className="font-medium line-clamp-2">
                                    {item.translated}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!currentTranslation && translationHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select text and translate to see results here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        {/* Replace Dialog */}
        <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Replace</DialogTitle>
              <DialogDescription>
                Replace all occurrences of &quot;{selectedText}&quot; in the Vietnamese text
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="replace-text">Replace with:</Label>
                <Input
                  id="replace-text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Enter replacement text..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReplaceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuickReplace} disabled={!replaceText.trim()}>
                Replace All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}