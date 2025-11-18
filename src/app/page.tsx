"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to editor when authenticated
    if (status === "authenticated" && session) {
      // For now, just show the authenticated state
      // Later: router.push('/editor');
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
          <div className="text-center space-y-8">
            <Image
              className="mx-auto dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={180}
              height={38}
              priority
            />
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                QT Translator
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
                A tool for translating Chinese novels from Quick Translator output to polished Vietnamese
              </p>
            </div>
            <button
              onClick={() => signIn("github")}
              className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              Sign in with GitHub
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="text-center space-y-8">
          <div className="flex items-center gap-4">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt="Profile"
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div className="text-left">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Welcome, {session.user?.name || 'User'}!
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Signed in as {session.user?.email}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
              QT Translator Ready
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-md">
              You&apos;re authenticated and ready to start translating. 
              The main editor interface will be implemented here.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                // TODO: Navigate to editor
                console.log('Navigate to editor');
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Start Translating
            </button>
            <button
              onClick={() => signOut()}
              className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg transition-colors dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200"
            >
              Sign Out
            </button>
          </div>
          
          <div className="text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
            <p>Session ID: {session.user?.id}</p>
            <p>Provider: GitHub</p>
          </div>
        </div>
      </main>
    </div>
  );
}
