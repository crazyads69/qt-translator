"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-4">Loading...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4 p-4">
        <div className="text-sm">
          Signed in as <strong>{session.user?.name || session.user?.email}</strong>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-2 text-sm text-gray-600">Not signed in</div>
      <button
        onClick={() => signIn("github")}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Sign in with GitHub
      </button>
    </div>
  );
}