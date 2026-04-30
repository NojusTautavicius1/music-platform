import { type ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="text-zinc-600">{icon}</div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-zinc-200">{title}</h3>
        <p className="text-sm text-zinc-500 max-w-xs">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
