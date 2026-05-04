import Link from "next/link";
import { AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Try again or contact support.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link has expired or already been used.",
  OAuthSignin: "Could not start the sign-in process. Try again.",
  OAuthCallback: "Could not complete sign-in. Try again.",
  OAuthCreateAccount: "Could not create your account. Try again.",
  EmailCreateAccount: "Could not create your account. Try again.",
  Callback: "Something went wrong during sign-in. Try again.",
  Default: "An unexpected error occurred. Please try again.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error ?? ""] ?? ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={28} className="text-orange-400" />
        </div>

        <h2 className="text-xl font-bold text-zinc-100 mb-2">Sign-in failed</h2>
        <p className="text-zinc-400 text-sm mb-8">{message}</p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
