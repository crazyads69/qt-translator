// Re-export types from validations to ensure consistency
import type { Chapter, Project } from "@/lib/validations";
export type { Chapter, Project } from "@/lib/validations";

const STORAGE_KEY = "qt-translator-project";

export const storage = {
  save: (project: Project): void => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  },

  load: (): Project | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  },

  updateContent: (qtInput: string, viOutput: string): void => {
    const current = storage.load();
    if (!current) return;

    const updated: Project = {
      ...current,
      updatedAt: new Date().toISOString(),
      content: {
        qtInput,
        viOutput,
      },
      metadata: {
        ...current.metadata,
        wordCount: viOutput.split(/\s+/).length,
      },
    };

    storage.save(updated);
  },
};