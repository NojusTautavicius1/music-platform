import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <div className="h-screen bg-[#0A0A0F] relative overflow-hidden flex items-center justify-center">
      {/* Ambient gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EC4899]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Card */}
      <div className="relative bg-[#18181F] rounded-2xl p-12 w-full max-w-[420px] border border-white/10 shadow-[0_0_60px_rgba(139,92,246,0.12)]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent mb-3">
            Sonara
          </h1>
          <p className="text-2xl font-semibold text-white">Welcome back</p>
          <p className="text-sm text-gray-400 mt-2">
            Sign in to continue your music journey
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
            <span className="px-4 bg-[#18181F] text-gray-400">or</span>
          </div>
        </div>

        {/* Email / password — disabled, coming soon */}
        <div className="space-y-4" title="Coming soon">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 text-gray-500"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              disabled
              placeholder="name@example.com"
              title="Coming soon"
              className="w-full h-12 px-4 bg-[#25252E]/50 border border-white/5 rounded-lg text-gray-600 placeholder:text-gray-600 cursor-not-allowed"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2 text-gray-500"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              disabled
              placeholder="Coming soon"
              title="Coming soon"
              className="w-full h-12 px-4 bg-[#25252E]/50 border border-white/5 rounded-lg text-gray-600 placeholder:text-gray-600 cursor-not-allowed"
            />
          </div>
          <button
            disabled
            title="Coming soon"
            className="w-full h-12 bg-gradient-to-r from-[#8B5CF6]/40 to-[#EC4899]/40 rounded-full font-semibold text-gray-500 cursor-not-allowed mt-2"
          >
            Sign in
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Don&apos;t have an account?{" "}
          <span className="text-white font-semibold cursor-not-allowed opacity-60">
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
