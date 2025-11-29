import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      login: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken: string;
    provider: string;
    error?: "RefreshTokenError";
  }

  interface User extends DefaultUser {
    login: string;
  }

  interface Profile {
    login: string;
    id: number;
    avatar_url: string;
    name?: string | null;
    email?: string | null;
    email_verified?: boolean;
    company?: string | null;
    blog?: string | null;
    location?: string | null;
    bio?: string | null;
    public_repos?: number;
    followers?: number;
    following?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken: string;
    githubId: string;
    login: string;
    provider: string;
    error?: "RefreshTokenError";
  }
}