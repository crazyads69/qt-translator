"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, X, BookOpen, Save, Loader2, FileText, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

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

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New chapter form state
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDescription, setNewChapterDescription] = useState("");
  
  // Project editing state
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  
  // Chapter editing state
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [editChapterDescription, setEditChapterDescription] = useState("");

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
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
        setEditProjectTitle(data.project.title);
        setEditProjectDescription(data.project.metadata.description || "");
      } catch (err) {
        console.error("Error loading project:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load project";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && resolvedParams.id) {
      loadProject();
    }
  }, [session, resolvedParams.id]);

  // Add new chapter
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) {
      toast.error("Chapter title is required");
      return;
    }

    if (!project) return;

    const newChapter: Chapter = {
      number: (project.metadata.chapters?.length || 0) + 1,
      title: newChapterTitle.trim(),
      description: newChapterDescription.trim() || undefined,
      status: "not-started"
    };

    const updatedProject = {
      ...project,
      metadata: {
        ...project.metadata,
        chapters: [...(project.metadata.chapters || []), newChapter]
      },
      updatedAt: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/r2/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) {
        throw new Error("Failed to save chapter");
      }

      setProject(updatedProject);
      setNewChapterTitle("");
      setNewChapterDescription("");
      setShowAddChapter(false);
      toast.success("Chapter added successfully!");
    } catch (err) {
      console.error("Error adding chapter:", err);
      toast.error("Failed to add chapter");
    } finally {
      setIsSaving(false);
    }
  };

  // Save project details
  const handleSaveProject = async () => {
    if (!editProjectTitle.trim()) {
      toast.error("Project title is required");
      return;
    }

    if (!project) return;

    const updatedProject = {
      ...project,
      title: editProjectTitle.trim(),
      metadata: {
        ...project.metadata,
        description: editProjectDescription.trim() || undefined
      },
      updatedAt: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/r2/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) {
        throw new Error("Failed to save project");
      }

      setProject(updatedProject);
      setIsEditingProject(false);
      toast.success("Project updated successfully!");
    } catch (err) {
      console.error("Error updating project:", err);
      toast.error("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!project) return;
    
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/r2/load?projectId=${resolvedParams.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast.success("Project deleted successfully!");
      router.push("/");
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error("Failed to delete project");
    } finally {
      setIsSaving(false);
    }
  };

  // Start editing chapter
  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter.number);
    setEditChapterTitle(chapter.title);
    setEditChapterDescription(chapter.description || "");
  };

  // Save chapter edit
  const handleSaveChapter = async () => {
    if (!editChapterTitle.trim()) {
      toast.error("Chapter title is required");
      return;
    }

    if (!project || editingChapter === null) return;

    const updatedChapters = project.metadata.chapters?.map(ch => 
      ch.number === editingChapter 
        ? { ...ch, title: editChapterTitle.trim(), description: editChapterDescription.trim() || undefined }
        : ch
    ) || [];

    const updatedProject = {
      ...project,
      metadata: {
        ...project.metadata,
        chapters: updatedChapters
      },
      updatedAt: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/r2/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) {
        throw new Error("Failed to save chapter");
      }

      setProject(updatedProject);
      setEditingChapter(null);
      setEditChapterTitle("");
      setEditChapterDescription("");
      toast.success("Chapter updated successfully!");
    } catch (err) {
      console.error("Error updating chapter:", err);
      toast.error("Failed to update chapter");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel chapter edit
  const handleCancelChapterEdit = () => {
    setEditingChapter(null);
    setEditChapterTitle("");
    setEditChapterDescription("");
  };

  // Remove chapter
  const handleRemoveChapter = async (chapterNumber: number) => {
    if (!project) return;

    const updatedChapters = project.metadata.chapters
      ?.filter(ch => ch.number !== chapterNumber)
      ?.map((ch, index) => ({ ...ch, number: index + 1 })) || [];

    const updatedProject = {
      ...project,
      metadata: {
        ...project.metadata,
        chapters: updatedChapters
      },
      updatedAt: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/r2/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) {
        throw new Error("Failed to remove chapter");
      }

      setProject(updatedProject);
      toast.success("Chapter removed successfully!");
    } catch (err) {
      console.error("Error removing chapter:", err);
      toast.error("Failed to remove chapter");
    } finally {
      setIsSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 flex items-center justify-center">
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-background px-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" onClick={() => router.push("/")} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {error || "Project not found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                The project you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
              </p>
              <Button onClick={() => router.push("/")}>
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4">
      <div className="w-full max-w-6xl mx-auto py-8">
        <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/")} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditingProject(true)}
              disabled={isSaving}
            >
              <FileText className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteProject}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
            
            <Badge variant={project.metadata.status === "completed" ? "default" : "secondary"}>
              {project.metadata.status || "in-progress"}
            </Badge>
          </div>
        </div>

        {/* Project Edit Form */}
        {isEditingProject && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Project Title *</Label>
                  <Input
                    id="edit-title"
                    value={editProjectTitle}
                    onChange={(e) => setEditProjectTitle(e.target.value)}
                    placeholder="Project title"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Project Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editProjectDescription}
                    onChange={(e) => setEditProjectDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={3}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProject} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingProject(false);
                      setEditProjectTitle(project.title);
                      setEditProjectDescription(project.metadata.description || "");
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">{project.title}</CardTitle>
            </div>
            {project.metadata.description && (
              <CardDescription className="text-base">
                {project.metadata.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Created: {formatDate(project.createdAt)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Updated: {formatDate(project.updatedAt)}
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Chapters: {project.metadata.chapters?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapters Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chapters</CardTitle>
              <Button onClick={() => setShowAddChapter(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Chapter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Chapter Form */}
            {showAddChapter && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="chapter-title">Chapter Title *</Label>
                    <Input
                      id="chapter-title"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="e.g., Chapter 1: The Beginning"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chapter-description">Chapter Description</Label>
                    <Textarea
                      id="chapter-description"
                      value={newChapterDescription}
                      onChange={(e) => setNewChapterDescription(e.target.value)}
                      placeholder="Brief description of this chapter..."
                      rows={2}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddChapter} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Add Chapter
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddChapter(false);
                        setNewChapterTitle("");
                        setNewChapterDescription("");
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Chapters List */}
            {project.metadata.chapters && project.metadata.chapters.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-2">
                  {project.metadata.chapters.map((chapter) => (
                  <div key={chapter.number}>
                    {editingChapter === chapter.number ? (
                      // Edit Mode
                      <div className="p-4 border rounded-lg bg-secondary/50">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">Chapter {chapter.number}</Badge>
                            <span className="text-sm text-muted-foreground">Editing</span>
                          </div>
                          <div>
                            <Label htmlFor={`edit-chapter-title-${chapter.number}`}>Chapter Title *</Label>
                            <Input
                              id={`edit-chapter-title-${chapter.number}`}
                              value={editChapterTitle}
                              onChange={(e) => setEditChapterTitle(e.target.value)}
                              placeholder="Chapter title"
                              disabled={isSaving}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-chapter-desc-${chapter.number}`}>Chapter Description</Label>
                            <Textarea
                              id={`edit-chapter-desc-${chapter.number}`}
                              value={editChapterDescription}
                              onChange={(e) => setEditChapterDescription(e.target.value)}
                              placeholder="Brief description..."
                              rows={2}
                              disabled={isSaving}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveChapter} disabled={isSaving} size="sm">
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleCancelChapterEdit}
                              disabled={isSaving}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline">Chapter {chapter.number}</Badge>
                            {chapter.status && (
                              <Badge 
                                variant={
                                  chapter.status === "completed" ? "default" :
                                  chapter.status === "in-progress" ? "secondary" :
                                  "outline"
                                }
                              >
                                {chapter.status}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-foreground">{chapter.title}</h4>
                          {chapter.description && (
                            <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
                          )}
                          {chapter.wordCount && (
                            <p className="text-xs text-muted-foreground/70 mt-1">{chapter.wordCount} words</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditChapter(chapter)}
                            disabled={isSaving || editingChapter !== null}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveChapter(chapter.number)}
                            disabled={isSaving || editingChapter !== null}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No chapters yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first chapter to begin translation work.
                </p>
                <Button onClick={() => setShowAddChapter(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Chapter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}