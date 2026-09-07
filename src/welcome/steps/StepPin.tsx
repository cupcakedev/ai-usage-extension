import type { ReactNode } from 'react';

import { msg } from '../../shared/i18n';
import { Frame } from '../components/Frame';
import { InstructionRow } from '../components/InstructionRow';

function PuzzleIcon() {
  return (
    <svg
      className="inline mx-[3px] -mt-px"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: 'var(--w-text-dim)' }}
    >
      <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-2 .9-2 2v3.8h1.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />
    </svg>
  );
}

const withIcon = (template: string, icon: ReactNode): ReactNode[] =>
  template.split('{icon}').flatMap((part, index) => (index === 0 ? [part] : [icon, part]));

export function StepPin({ videoUrl, onDone }: { videoUrl: string; onDone: () => void }) {
  return (
    <div className="mx-auto grid w-full max-w-[1120px] items-center gap-10 lg:grid-cols-[410px_minmax(0,1fr)] lg:gap-16">
      <section className="flex flex-col items-start">
        <h1 className="welcome-title max-w-[560px] text-[54px] font-semibold leading-[0.98] tracking-[-1.8px] text-[var(--w-text)]">
          {msg('welcomeTitle')}
        </h1>

        <p className="mt-5 max-w-[390px] text-[15px] leading-[1.6] text-[var(--w-text-dim)]">
          {msg('welcomeSubtitle')}
        </p>

        <div className="mt-8 flex w-full flex-col gap-4 rounded-[20px] border border-[var(--w-border)] bg-[var(--w-surface)] p-5">
          <InstructionRow num={1}>
            {withIcon(msg('welcomeStepPin'), <PuzzleIcon key="puzzle" />)}
          </InstructionRow>
          <InstructionRow num={2}>{msg('welcomeStepOpen')}</InstructionRow>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={onDone}
            className="inline-flex h-12 items-center justify-center rounded-[16px] border border-[var(--w-accent)] bg-[var(--w-accent)] px-6 text-[14px] font-semibold text-[var(--w-accent-ink)] transition-colors duration-150 hover:border-[var(--w-accent-hover)] hover:bg-[var(--w-accent-hover)]"
          >
            {msg('welcomeCta')}
          </button>
          <span className="text-[13px] text-[var(--w-text-mute)]">{msg('welcomeCtaHint')}</span>
        </div>
      </section>

      <section className="w-full">
        <Frame src={videoUrl} />
      </section>
    </div>
  );
}
