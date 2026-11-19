"use client";

import { useRouter } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { InlineError } from "./InlineError";

// One failing section (e.g. DB timeout) shows an inline note instead of taking down the whole page.
export function SectionBoundary({ label, children }: { label: string; children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-100 mb-4">{label}</h2>
          <InlineError
            message="Couldn't load this section right now."
            onRetry={() => {
              router.refresh();
              resetErrorBoundary();
            }}
          />
        </section>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
