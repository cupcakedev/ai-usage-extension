export function ToolbarPointer() {
  return (
    <div className="fixed top-2 right-32 w-[300px] h-[220px] pointer-events-none z-40 opacity-80">
      <svg viewBox="0 0 320 240" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="pGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--w-pointer)" stopOpacity="0.08" />
            <stop offset="70%" stopColor="var(--w-pointer)" stopOpacity="0.42" />
            <stop offset="100%" stopColor="var(--w-pointer)" stopOpacity="0.56" />
          </linearGradient>
        </defs>
        <path
          d="M 120 160 C 140 90, 230 80, 282 22"
          stroke="url(#pGrad)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 282 22 L 260 32 M 282 22 L 276 46"
          stroke="var(--w-pointer)"
          strokeOpacity="0.56"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
