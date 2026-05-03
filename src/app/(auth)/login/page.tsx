import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center">
      {/* Ambient gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-magenta/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Card */}
      <div className="relative bg-[#18181F] rounded-2xl p-12 w-full max-w-105 border border-white/10 shadow-[0_0_60px_rgba(255,85,0,0.12)]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-brand-orange to-brand-magenta bg-clip-text text-transparent mb-3">
            Sonara
          </h1>
          <p className="text-2xl font-semibold text-white">Welcome</p>
          <p className="text-sm text-gray-400 mt-2">
            Sign in or create your account
          </p>
        </div>

        {/* Google sign-in */}
        <div className="mb-6">
          <GoogleSignInButton />
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#18181F] text-gray-400">or continue with email</span>
          </div>
        </div>

        {/* Magic link form */}
        <MagicLinkForm />

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-zinc-400 hover:text-white underline underline-offset-2">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
