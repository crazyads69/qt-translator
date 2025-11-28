"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Github, LogOut } from "lucide-react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-4">
          <Spinner className="mr-2" />
          <span>Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (session) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          {session.user?.image && (
            <Avatar>
              <AvatarImage src={session.user.image} alt={session.user.name || "Avatar"} />
              <AvatarFallback>{(session.user?.name || "U")[0]}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 text-sm">
            Signed in as <strong>{session.user?.name || session.user?.email}</strong>
          </div>
          <Button
            onClick={() => signOut()}
            variant="destructive"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 text-sm text-muted-foreground">Not signed in</div>
        <Button
          onClick={() => signIn("github")}
          className="w-full"
        >
          <Github className="mr-2 h-4 w-4" />
          Sign in with GitHub
        </Button>
      </CardContent>
    </Card>
  );
}