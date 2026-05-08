import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  return { userEmail: session.user.email };
}

export const uploadRouter = {
  playlistCover: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(requireAuth)
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  songAudio: f({ audio: { maxFileSize: "32MB", maxFileCount: 1 } })
    .middleware(requireAuth)
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name, size: file.size };
    }),

  songCover: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(requireAuth)
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
