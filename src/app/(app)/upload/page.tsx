import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UploadSongForm } from "@/components/upload/UploadSongForm";

export const metadata = { title: "Upload Music — Sonara" };

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">Upload Music</h1>
        <p className="text-zinc-500 mt-2">Add a track to the Sonara library.</p>
      </div>
      <UploadSongForm />
    </div>
  );
}
