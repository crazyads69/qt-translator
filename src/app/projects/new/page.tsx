"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, X, BookOpen, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Chapter {
  id: string;
  number: number;
  title: string;
  description?: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Project form state
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Add new chapter
  const addChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      number: chapters.length + 1,
      title: "",
      description: ""
    };
    setChapters([...chapters, newChapter]);
  };

  // Remove chapter
  const removeChapter = (id: string) => {
    const updatedChapters = chapters
      .filter(chapter => chapter.id !== id)
      .map((chapter, index) => ({
        ...chapter,
        number: index + 1
      }));
    setChapters(updatedChapters);
  };

  // Update chapter
  const updateChapter = (id: string, field: keyof Chapter, value: string) => {
    setChapters(chapters.map(chapter => 
      chapter.id === id ? { ...chapter, [field]: value } : chapter
    ));
  };

  // Form validation
  const isFormValid = () => {
    if (!projectTitle.trim()) return false;
    // Only validate chapter titles if chapters exist
    if (chapters.length > 0 && chapters.some(chapter => !chapter.title.trim())) return false;
    return true;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error("Please sign in to create a project");
      return;
    }

    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/r2/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: projectTitle.trim(),
          description: projectDescription.trim(),
          chapters: chapters.map(chapter => ({
            number: chapter.number,
            title: chapter.title.trim(),
            description: chapter.description?.trim() || ""
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      await response.json(); // Consume the response
      toast.success("Project created successfully!");
      
      // Navigate to the project or back to home
      router.push("/");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background px-4">
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Create New Translation Project</h1>
          </div>
          <p className="text-muted-foreground">
            Set up your Chinese to Vietnamese novel translation project with multiple chapters
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Basic details about your translation project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g., Against the Gods - Vietnamese Translation"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of the novel and your translation goals..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chapters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chapters</CardTitle>
                  <CardDescription>
                    Organize your translation work by chapters
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChapter}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Chapter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-2">
                  {chapters.map((chapter, index) => (
                  <div key={chapter.id}>
                    {index > 0 && <Separator />}
                    <div className="space-y-3 pt-4 first:pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Chapter {chapter.number}
                          </Badge>
                        </div>
                        {chapters.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChapter(chapter.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Chapter Title *</Label>
                          <Input
                            value={chapter.title}
                            onChange={(e) => updateChapter(chapter.id, "title", e.target.value)}
                            placeholder="e.g., The Beginning of Everything"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Chapter Description</Label>
                          <Input
                            value={chapter.description}
                            onChange={(e) => updateChapter(chapter.id, "description", e.target.value)}
                            placeholder="Brief chapter summary (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}