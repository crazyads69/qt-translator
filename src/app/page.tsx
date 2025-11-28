"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Github, Play, LogOut } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      // placeholder for future navigation
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Spinner className="mb-4 h-8 w-8" />
            <div className="text-lg text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>QT Translator</CardTitle>
            <CardDescription>A tool to convert Quick Translator output to polished Vietnamese.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 py-6">
              <Image src="/next.svg" alt="Logo" width={160} height={36} className="dark:invert" />
              <Button onClick={() => signIn("github")} size="lg">
                <Github className="w-4 h-4 mr-2" />
                <span>Sign in with GitHub</span>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <span className="text-sm text-muted-foreground">Access is limited to authorized users.</span>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            {session.user?.image ? (
              <Avatar>
                <AvatarImage src={session.user.image} alt={session.user.name || "Avatar"} />
                <AvatarFallback>{(session.user?.name || "U")[0]}</AvatarFallback>
              </Avatar>
            ) : null}
            <div>
              <CardTitle>Welcome, {session.user?.name || "User"}</CardTitle>
              <CardDescription>Signed in as {session.user?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">QT Translator Ready</h2>
            <p className="text-sm text-muted-foreground">You&apos;re authenticated and ready to start translating. The main editor will be available here.</p>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => console.log("Navigate to editor")}>
              <Play className="w-4 h-4 mr-2" />
              Start Translating
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
