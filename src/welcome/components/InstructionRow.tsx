import type { ReactNode } from 'react';

export function InstructionRow({ num, children }: { num: number; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--w-step)] text-[12px] font-semibold text-[var(--w-text)] [font-variant-numeric:tabular-nums]">
        {num}
      </div>
      <div className="pt-[2px] text-[14px] font-medium leading-[1.5] text-[var(--w-text-dim)]">
        {children}
      </div>
    </div>
  );
}
