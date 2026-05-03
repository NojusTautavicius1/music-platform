import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WelcomeFlow } from "@/components/auth/WelcomeFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to Sonara",
};

export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <WelcomeFlow userName={session.user.name?.split(" ")[0] ?? "there"} />;
}
