import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Sonara",
  description: "Sonara terms of service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-zinc-100 px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-brand-orange hover:underline text-sm mb-8 block">
          ← Back to Sonara
        </Link>
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance</h2>
            <p>By accessing or using Sonara, you agree to be bound by these terms. If you do not agree, do not use the service.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Use of Service</h2>
            <p>Sonara is a music streaming platform. You may use it for personal, non-commercial purposes. You must not misuse the service, attempt to access it by unauthorized means, or upload infringing content.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Accounts</h2>
            <p>You are responsible for maintaining the security of your account. We reserve the right to suspend accounts that violate these terms.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Content</h2>
            <p>All music available on Sonara is either licensed or in the public domain. User-created playlists are subject to our content policy.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Disclaimer</h2>
            <p>Sonara is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Changes</h2>
            <p>We may update these terms at any time. Continued use of the service constitutes acceptance of the updated terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
