"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "Access denied. Your GitHub account is not authorized to use this application.",
  Verification: "The verification link is invalid or has expired.",
  Default: "An unknown error occurred during authentication.",
};

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  useEffect(() => {
    // Log error for debugging
    if (error) {
      console.error(`NextAuth Error: ${error}`);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background px-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <Image className="mx-auto h-12 w-auto dark:invert" src="/next.svg" alt="QT Translator" width={160} height={36} />
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription className="mt-1">{error || "Authentication Failed"}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {errorMessage}
            </AlertDescription>
          </Alert>

          {error === "AccessDenied" && (
            <Alert>
              <AlertDescription>
                <p className="font-medium mb-1">Need access?</p>
                <p className="text-sm">This application is restricted to authorized users. If you believe you should have access, contact the administrator.</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/auth/signin">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
          <div className="text-center w-full pt-2">
            <p className="text-xs text-muted-foreground">Error code: {error || "UNKNOWN"}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function AuthErrorFallback() {
  return (
    <div className="min-h-screen bg-background px-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Spinner className="mb-4 h-8 w-8" />
          <div className="text-lg text-muted-foreground">Loading error details...</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}