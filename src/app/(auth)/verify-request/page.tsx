import { VerifyRequestView } from "@/components/auth/VerifyRequestView";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-magenta/20 rounded-full blur-[120px] pointer-events-none" />
      <VerifyRequestView />
    </div>
  );
}
