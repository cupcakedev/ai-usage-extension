import type { CSSProperties } from 'react';

export const THEME_VARS: CSSProperties = {
  ['--w-bg' as string]: '#0F0F0F',
  ['--w-text' as string]: '#EBE9E4',
  ['--w-text-dim' as string]: '#8D8A84',
  ['--w-text-mute' as string]: '#66635E',
  ['--w-border' as string]: 'rgba(255,255,255,0.08)',
  ['--w-border-hi' as string]: 'rgba(255,255,255,0.16)',
  ['--w-surface' as string]: 'rgba(22,22,22,0.68)',
  ['--w-surface-hi' as string]: '#161616',
  ['--w-step' as string]: 'rgba(255,255,255,0.07)',
  ['--w-accent' as string]: '#D8D4CA',
  ['--w-accent-hover' as string]: '#EBE9E4',
  ['--w-accent-ink' as string]: '#0F0F0F',
  ['--w-pointer' as string]: '#8D8A84',
};

export const STAGE_KEYFRAMES = `
@keyframes welcome-stage-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}
.welcome-stage { animation: welcome-stage-in 0.36s ease-out; }

@media (max-width: 920px) {
    .welcome-title { font-size: 44px; letter-spacing: -1.1px; }
}

@media (max-width: 720px) {
    .welcome-title { font-size: 34px; line-height: 1.08; }
}
`;
