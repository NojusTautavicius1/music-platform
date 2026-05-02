"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = {
  error?: Error;
  message?: string;
  resetErrorBoundary?: () => void;
  onRetry?: () => void;
};

export function InlineError({ message = "Something went wrong.", resetErrorBoundary, onRetry }: Props) {
  const handleRetry = resetErrorBoundary ?? onRetry;

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
      <AlertTriangle size={14} className="text-orange-400 shrink-0" />
      <p className="text-sm text-zinc-400 flex-1">{message}</p>
      {handleRetry && (
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <RotateCcw size={11} />
          Retry
        </button>
      )}
    </div>
  );
}
