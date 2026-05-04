"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { checkVerificationStatus } from "@/app/actions/checkVerificationStatus";

type Phase = "waiting" | "confirmed_elsewhere" | "error";

export function VerifyRequestView() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<Phase>("waiting");
  const [isSigning, setIsSigning] = useState(false);
  const emailRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read email saved by MagicLinkForm before the redirect
  useEffect(() => {
    emailRef.current = sessionStorage.getItem("magic-link-email");
  }, []);

  // If session already exists in this browser, just go home
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      sessionStorage.removeItem("magic-link-email");
      router.replace("/");
    }
  }, [status, session, router]);

  // Poll for token consumption (cross-device confirmation)
  useEffect(() => {
    if (status === "authenticated") return;

    function poll() {
      const email = emailRef.current;
      if (!email) return;

      checkVerificationStatus(email).then((result) => {
        if (result === "confirmed") {
          clearInterval(intervalRef.current!);
          setPhase("confirmed_elsewhere");
        }
      });
    }

    intervalRef.current = setInterval(poll, 2500);
    return () => clearInterval(intervalRef.current!);
  }, [status]);

  async function handleSignInHere() {
    const email = emailRef.current;
    if (!email) return;
    setIsSigning(true);
    try {
      sessionStorage.setItem("magic-link-email", email);
      await signIn("resend", { email, redirectTo: "/" });
    } catch {
      setPhase("error");
      setIsSigning(false);
    }
  }

  if (phase === "confirmed_elsewhere") {
    return (
      <div className="relative bg-[#18181F] rounded-2xl p-6 sm:p-12 w-full max-w-md border border-white/10 shadow-[0_0_60px_rgba(255,85,0,0.12)] text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={28} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Confirmed on another device</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          You confirmed your email on another device. Click below to sign in here too.
        </p>
        <button
          onClick={handleSignInHere}
          className="w-full h-12 flex items-center justify-center gap-2 bg-linear-to-r from-brand-orange to-brand-magenta rounded-full font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {isSigning ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Sign in on this device
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-[#18181F] rounded-2xl p-6 sm:p-12 w-full max-w-md border border-white/10 shadow-[0_0_60px_rgba(255,85,0,0.12)] text-center">
      <div className="w-16 h-16 rounded-full bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center mx-auto mb-6">
        <Mail size={28} className="text-brand-orange" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-3">Check your inbox</h1>
      <p className="text-gray-400 text-sm leading-relaxed mb-4">
        A sign-in link has been sent to your email address. It expires in{" "}
        <span className="text-zinc-300 font-medium">10 minutes</span>.
      </p>

      {/* Animated waiting indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-8">
        <Loader2 size={13} className="animate-spin text-brand-orange/60" />
        <span>Waiting for confirmation…</span>
      </div>

      <p className="text-xs text-gray-600">
        Didn&apos;t receive it?{" "}
        <Link href="/login" className="text-zinc-400 hover:text-white underline underline-offset-2">
          Try again
        </Link>
      </p>
    </div>
  );
}
