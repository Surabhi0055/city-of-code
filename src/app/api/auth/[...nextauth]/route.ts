import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/signup',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always redirect to home after sign-in, never back to /signup
      if (url.startsWith(baseUrl)) {
        if (url.includes('/signup') || url.includes('/api/auth')) return baseUrl;
        return url;
      }
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_development_only",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
