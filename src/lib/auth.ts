import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { verifyUserCredentials } from "./auth-service";

interface ExtendedUser {
  id: string;
  role?: string;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "pf_super_secret_jwt_key_2026_dev_fallback",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const user = await verifyUserCredentials(credentials.email, credentials.password);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const extUser = user as unknown as ExtendedUser;
        token.id = extUser.id;
        token.role = extUser.role || "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const extSession = session.user as unknown as ExtendedUser;
        extSession.id = token.id as string;
        extSession.role = (token.role as string) || "CUSTOMER";
      }
      return session;
    },
  },
};