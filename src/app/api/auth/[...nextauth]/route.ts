import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ profile }) {
      // Add your GitHub username here to whitelist
      const allowedUsers = [
        "crazyads69",
      ];

      // If no users are specified, allow all (for development)
      if (allowedUsers.length === 0) {
        return true;
      }

      // Check if the user's GitHub username is in the allowed list
      const githubUsername = profile?.login;
      return allowedUsers.includes(githubUsername || "");
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };