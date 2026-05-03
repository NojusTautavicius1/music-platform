import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? "noreply@sonara.app",
      name: "Sonara",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // middleware.ts now handles route protection; this just exposes session
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // first sign-in: ensure UserPreferences row exists
      // imported lazily to avoid edge-runtime issues in auth.config
      if (!user.id) return
      const { prisma } = await import("@/lib/prisma")
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      })
    },
  },
}
