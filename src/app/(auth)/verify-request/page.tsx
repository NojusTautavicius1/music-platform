import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-magenta/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative bg-[#18181F] rounded-2xl p-12 w-full max-w-105 border border-white/10 shadow-[0_0_60px_rgba(255,85,0,0.12)] text-center">
        <div className="w-16 h-16 rounded-full bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-brand-orange" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Check your inbox</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          A sign-in link has been sent to your email address. It expires in{" "}
          <span className="text-zinc-300 font-medium">10 minutes</span>.
        </p>

        <p className="text-xs text-gray-600">
          Didn&apos;t receive it?{" "}
          <Link href="/login" className="text-zinc-400 hover:text-white underline underline-offset-2">
            Try again
          </Link>
        </p>
      </div>
    </div>
  );
}
