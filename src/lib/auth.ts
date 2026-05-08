import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "../../auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  events: {
    async createUser({ user }) {
      if (!user.id) return
      try {
        await prisma.userPreferences.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        })
      } catch {
        // non-fatal: preferences can be created on next sign-in
      }
    },
  },
})
