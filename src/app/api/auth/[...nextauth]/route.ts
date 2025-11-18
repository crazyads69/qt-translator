import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

// Validate required environment variables at startup
if (!process.env.GITHUB_ID) {
  throw new Error('GITHUB_ID environment variable is required');
}
if (!process.env.GITHUB_SECRET) {
  throw new Error('GITHUB_SECRET environment variable is required');
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      // Enhanced GitHub provider configuration
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          // Store GitHub username for whitelist checking
          login: profile.login,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Whitelist configuration
        const allowedUsers = [
          "crazyads69",
          // Add more GitHub usernames here
        ];

        // Allow all users in development mode
        if (process.env.NODE_ENV === "development" && allowedUsers.length === 0) {
          return true;
        }

        // Check if the user's GitHub username is in the allowed list
        const githubUsername = profile?.login || (user as any)?.login;
        
        if (!githubUsername) {
          console.error('GitHub username not found in profile:', profile);
          return false;
        }

        const isAllowed = allowedUsers.includes(githubUsername);
        
        if (!isAllowed) {
          console.warn(`Access denied for user: ${githubUsername}`);
        }

        return isAllowed;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // Store GitHub info in JWT
      if (account && user) {
        token.accessToken = account.access_token;
        token.githubId = user.id;
        token.login = (user as any).login;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.githubId as string;
        session.user.login = token.login as string;
        session.accessToken = token.accessToken as string;
        session.provider = token.provider as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`);
    },
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };