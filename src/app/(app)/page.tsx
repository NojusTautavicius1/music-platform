import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0F] text-white gap-6">
      <p className="text-2xl font-semibold">Hello, {session.user.name}</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="px-6 py-2 rounded-full border border-white/20 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
