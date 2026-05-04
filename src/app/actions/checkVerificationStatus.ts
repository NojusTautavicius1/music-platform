"use server";
import { prisma } from "@/lib/prisma";

export type VerificationStatus = "pending" | "confirmed" | "unknown";

export async function checkVerificationStatus(email: string): Promise<VerificationStatus> {
  const token = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  });
  if (token) return "pending";
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });
  if (user?.emailVerified) return "confirmed";
  return "unknown";
}
