"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "Access denied. Your GitHub account is not authorized to use this application.",
  Verification: "The verification link is invalid or has expired.",
  Default: "An unknown error occurred during authentication.",
};

export default function AuthError() {
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <Image
            className="mx-auto h-12 w-auto dark:invert"
            src="/next.svg"
            alt="QT Translator"
            width={180}
            height={38}
          />
          <h2 className="mt-6 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Authentication Error
          </h2>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">
          <div className="flex items-center">
            <div className="shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {error || "Authentication Failed"}
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>

        {error === "AccessDenied" && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-2">Need access?</p>
              <p>This application is restricted to authorized users. If you believe you should have access:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Verify you&apos;re using the correct GitHub account</li>
                <li>Contact the application administrator</li>
                <li>Check if your GitHub username is in the allowlist</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
          >
            Try Again
          </Link>
          
          <button
            onClick={() => router.push("/")}
            className="w-full flex justify-center py-3 px-4 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
          >
            Go Home
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Error code: {error || "UNKNOWN"}
          </p>
        </div>
      </div>
    </div>
  );
}