"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DisplayNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Max 60 characters"),
});

const PreferencesSchema = z.object({
  defaultVolume: z.number().min(0).max(1),
  crossfadeSeconds: z.number().min(0).max(12),
  audioQuality: z.enum(["auto", "low", "medium", "high"]),
  autoPlayEnabled: z.boolean(),
  emailNewPlaylists: z.boolean(),
  emailWeekly: z.boolean(),
  profilePublic: z.boolean(),
  showActivity: z.boolean(),
});

type PreferencesInput = z.infer<typeof PreferencesSchema>;

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateDisplayName(name: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const parsed = DisplayNameSchema.safeParse({ name });
  if (!parsed.success) return { ok: false, error: "Invalid name" };

  await prisma.user.update({
    where: { email: session.user.email },
    data: { name: parsed.data.name },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { ok: true };
}

export async function updatePreferences(input: PreferencesInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const parsed = PreferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid preferences" };

  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteAccount(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  const tombstoneEmail = `deleted+${user.id}@example.invalid`;

  await prisma.user.update({
    where: { id: user.id },
    data: { email: tombstoneEmail, name: "Deleted User", image: null },
  });

  await signOut({ redirectTo: "/login" });
  return { ok: true };
}
