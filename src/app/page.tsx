"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, Plus, FileText, Calendar, Clock, AlertCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
    chapter?: number;
    progress?: number;
    wordCount?: number;
    status?: "in-progress" | "completed";
    version?: string;
  };
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (!session) {
      console.log("No session found, redirecting to signin");
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  // Load projects when authenticated
  const loadProjects = useCallback(async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/r2/projects");
      if (!response.ok) {
        throw new Error("Failed to load projects");
      }
      
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Error loading projects:", err);
      setError(err instanceof Error ? err.message : "Failed to load projects");
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      loadProjects();
    }
  }, [session, status, loadProjects]);

  const createNewProject = () => {
    router.push("/projects/new");
  };

  const openProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleDeleteProject = async (projectId: string, projectTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm(`Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/r2/load?projectId=${projectId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast.success("Project deleted successfully!");
      loadProjects(); // Refresh the list
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error("Failed to delete project");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case "completed":
        return "default"; // Uses primary color
      case "in-progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getWordCountDisplay = (wordCount?: number) => {
    if (!wordCount) return "0 words";
    return wordCount >= 1000 
      ? `${(wordCount / 1000).toFixed(1)}k words`
      : `${wordCount} words`;
  };

  if (status === "loading") {
    return (
      <div className="h-screen bg-background px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Spinner className="mb-4 h-8 w-8" />
            <div className="text-lg text-muted-foreground">Checking authentication...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no session, don't render anything (redirect will happen)
  if (!session) {
    return (
      <div className="h-screen bg-background px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Spinner className="mb-4 h-8 w-8" />
            <div className="text-lg text-muted-foreground">Redirecting to sign in...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background px-4 flex flex-col">
      <div className="w-full max-w-6xl mx-auto py-4 flex-1 flex flex-col">
        <Card className="w-full flex-1 flex flex-col">
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {session?.user?.image ? (
                  <Avatar>
                    <AvatarImage src={session.user.image} alt={session.user.name || "Avatar"} />
                    <AvatarFallback>{(session.user?.name || "U")[0]}</AvatarFallback>
                  </Avatar>
                ) : null}
                <div>
                  <CardTitle>Welcome, {session?.user?.name || "User"}</CardTitle>
                  <CardDescription>
                    {projects.length === 0 
                      ? "Ready to start your first translation project"
                      : `${projects.length} translation ${projects.length === 1 ? 'project' : 'projects'}`
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={createNewProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
                <Button variant="outline" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner className="h-8 w-8 mr-3" />
                <span className="text-muted-foreground">Loading projects...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to load projects</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadProjects} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-6" />
                <h3 className="text-2xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Create your first translation project to get started with converting Chinese novels to Vietnamese.
                </p>
                <Button onClick={createNewProject} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                  {projects.map((project) => (
                    <Card 
                      key={project.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => openProject(project.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                            {project.metadata.chapter && (
                              <CardDescription>Chapter {project.metadata.chapter}</CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {project.metadata.status && (
                              <Badge variant={getStatusVariant(project.metadata.status)}>
                                {project.metadata.status === "in-progress" ? "In Progress" : "Completed"}
                              </Badge>
                            )}
                            
                            {/* Quick Actions */}
                            <div className="flex items-center gap-1 ml-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/projects/${project.id}`);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => handleDeleteProject(project.id, project.title, e)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="py-2">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            <span>{getWordCountDisplay(project.metadata.wordCount)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Created {formatDate(project.createdAt)}</span>
                          </div>
                          
                          {project.updatedAt !== project.createdAt && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>Updated {formatDate(project.updatedAt)} at {formatTime(project.updatedAt)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-2">
                        {project.metadata.progress !== undefined && (
                          <div className="w-full">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{Math.round(project.metadata.progress)}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, project.metadata.progress))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}