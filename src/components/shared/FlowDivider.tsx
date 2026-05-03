export function FlowDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: "100%", height: 24, display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5500" stopOpacity="0" />
          <stop offset="50%" stopColor="#FF5500" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FF5500" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,12 C100,4 200,20 300,12 C400,4 500,20 600,12 C700,4 750,18 800,12"
        fill="none"
        stroke="url(#flow-grad)"
        strokeWidth="1.5"
        strokeDasharray="200"
        style={{ animation: "flow-wave 4s linear infinite" }}
      />
    </svg>
  );
}
