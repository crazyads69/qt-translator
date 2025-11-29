"use client";

import { getProviders, signIn, getSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Github, AlertTriangle } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      setProviders(res as Record<string, Provider> | null);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session) {
        router.push(callbackUrl);
      }
    })();
  }, [router, callbackUrl]);

  const handleSignIn = (providerId: string) => {
    signIn(providerId, { callbackUrl });
  };

  if (!providers) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Spinner className="mb-4 h-8 w-8" />
          <div className="text-lg text-muted-foreground">Loading providers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to QT Translator</CardTitle>
        <CardDescription>Use your GitHub account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error === "AccessDenied" && "Access denied. Your GitHub account is not authorized."}
                {error === "Configuration" && "There is a problem with the server configuration."}
                {error === "Verification" && "The verification token is invalid or has expired."}
                {error && !["AccessDenied", "Configuration", "Verification"].includes(error) && `An error occurred: ${error}`}
              </AlertDescription>
            </Alert>
          )}

          {Object.values(providers).map((provider: Provider) => (
            <Button key={provider.name} onClick={() => handleSignIn(provider.id)}>
              {provider.name.toLowerCase() === 'github' && <Github className="mr-2 h-4 w-4" />}
              <span>Sign in with {provider.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <span className="text-xs text-muted-foreground">Access is restricted to authorized users.</span>
      </CardFooter>
    </Card>
  );
}

function SignInFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Spinner className="mb-4 h-8 w-8" />
        <div className="text-lg text-muted-foreground">Loading sign in...</div>
      </CardContent>
    </Card>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <div className="min-h-screen bg-background px-4 flex items-center justify-center">
        <SignInContent />
      </div>
    </Suspense>
  );
}