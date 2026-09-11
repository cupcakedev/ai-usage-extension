import claudeBrandAsset from '../assets/brands/claude-anthropic.jpg';
import codexBrandAsset from '../assets/brands/codex-openai.jpg';
import cursorBrandAsset from '../assets/brands/cursor.webp';
import kimiBrandAsset from '../assets/brands/kimi.webp';
import minimaxBrandAsset from '../assets/brands/minimax.webp';
import mimoBrandAsset from '../assets/brands/xiaomimimo.webp';
import qwenBrandAsset from '../assets/brands/qwen.webp';
import zaiBrandAsset from '../assets/brands/zai.webp';
import { MessageSquareWarning, RefreshCw, Settings } from 'lucide-react';
import { useCallback, useState } from 'react';
import { GITHUB_ISSUES_URL, GITHUB_REPO_URL, POSTHOG_PROJECT_TOKEN } from '../shared/constants';
import { trackFrom } from '../shared/analytics/track';
import { msg } from '../shared/i18n';
import { useNow } from '../shared/hooks/useNow';
import type { ProviderId, ProviderLink } from '../shared/types';
import { ProviderCard } from './components/ProviderCard';
import { ReportDialog } from './components/ReportDialog';
import { useUsageData } from './hooks/useUsageData';
import './styles/global.css';

const PROVIDERS: Array<{
  id: ProviderId;
  title: string;
  iconSrc: string;
  iconAlt: string;
  emptyHint: string;
  emptyHintLink: ProviderLink;
  primaryLabel?: string;
  secondaryLabel?: string;
}> = [
  {
    id: 'claude',
    title: 'Claude',
    iconSrc: claudeBrandAsset,
    iconAlt: 'Claude by Anthropic',
    emptyHint: msg('emptyClaude'),
    emptyHintLink: { host: 'claude.ai', url: 'https://claude.ai/settings/usage' },
  },
  {
    id: 'codex',
    title: 'Codex',
    iconSrc: codexBrandAsset,
    iconAlt: 'OpenAI',
    emptyHint: msg('emptyCodex'),
    emptyHintLink: { host: 'chatgpt.com', url: 'https://chatgpt.com/codex' },
  },
  {
    id: 'minimax',
    title: 'MiniMax',
    iconSrc: minimaxBrandAsset,
    iconAlt: 'MiniMax',
    emptyHint: msg('emptyMiniMax'),
    emptyHintLink: {
      host: 'platform.minimax.io',
      url: 'https://platform.minimax.io/user-center/payment/coding-plan',
    },
  },
  {
    id: 'kimi',
    title: 'Kimi Code',
    iconSrc: kimiBrandAsset,
    iconAlt: 'Kimi',
    emptyHint: msg('emptyKimi'),
    emptyHintLink: { host: 'kimi.com/code', url: 'https://www.kimi.com/code' },
  },
  {
    id: 'cursor',
    title: 'Cursor',
    iconSrc: cursorBrandAsset,
    iconAlt: 'Cursor',
    emptyHint: msg('emptyCursor'),
    emptyHintLink: { host: 'cursor.com', url: 'https://cursor.com/dashboard' },
    primaryLabel: msg('planUsage'),
    secondaryLabel: '',
  },
  {
    id: 'mimo',
    title: 'Xiaomi MiMo',
    iconSrc: mimoBrandAsset,
    iconAlt: 'Xiaomi MiMo',
    emptyHint: msg('emptyMiMo'),
    emptyHintLink: { host: 'platform.xiaomimimo.com', url: 'https://platform.xiaomimimo.com' },
    primaryLabel: msg('tokenPlan'),
    secondaryLabel: '',
  },
  {
    id: 'glm',
    title: 'GLM Coding Plan',
    iconSrc: zaiBrandAsset,
    iconAlt: 'z.ai',
    emptyHint: msg('emptyGlm'),
    emptyHintLink: { host: 'z.ai', url: 'https://z.ai/manage-apikey/coding-plan/personal/usage' },
  },
  {
    id: 'qwen',
    title: 'Qwen Coding Plan',
    iconSrc: qwenBrandAsset,
    iconAlt: 'Qwen Cloud',
    emptyHint: msg('emptyQwen'),
    emptyHintLink: {
      host: 'qwencloud.com',
      url: 'https://home.qwencloud.com/billing/subscription/token-plan-individual',
    },
  },
];

const track = trackFrom('popup');

export const App = () => {
  const { usage, settings, loading, refreshing, error, refresh } = useUsageData();
  const now = useNow(30_000);
  const [reportOpen, setReportOpen] = useState(false);

  const sendReport = useCallback(
    (message: string) =>
      track('problem_reported', { message, message_length: message.length }).catch(() => false),
    [],
  );

  return (
    <main className={`au-shell ${settings?.popupLayout === 'grid' ? 'au-shell--grid' : ''}`}>
      <header className="au-topbar">
        <div>
          <h2 className="au-title">{msg('popupTitle')}</h2>
        </div>
        <div className="au-topbar__actions">
          <button
            type="button"
            onClick={() => void chrome.runtime.openOptionsPage()}
            className="au-btn-refresh"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="au-icon-refresh" aria-hidden="true" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className={`au-btn-refresh ${refreshing ? 'au-btn-refresh--spin' : ''}`}
            title={msg('refreshUsage')}
            aria-label={msg('refreshUsage')}
          >
            <RefreshCw className="au-icon-refresh" aria-hidden="true" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {error && (
        <p className="au-error" role="alert">
          {msg('refreshErrorPrefix')} - {error}
        </p>
      )}
      <div className={`au-cards ${settings?.popupLayout === 'grid' ? 'au-cards--grid' : ''}`}>
        {PROVIDERS.filter((provider) => settings?.providers[provider.id].visible !== false).map(
          (provider) => (
            <ProviderCard
              key={provider.id}
              title={provider.title}
              iconSrc={provider.iconSrc}
              iconAlt={provider.iconAlt}
              usage={usage[provider.id]}
              loading={(loading || refreshing) && !usage[provider.id]}
              now={now}
              emptyHint={provider.emptyHint}
              emptyHintLink={provider.emptyHintLink}
              issue={usage.issues?.[provider.id]}
              primaryLabel={provider.primaryLabel}
              secondaryLabel={provider.secondaryLabel}
              metrics={settings?.providers[provider.id].metrics}
            />
          ),
        )}
        {settings && !PROVIDERS.some((provider) => settings.providers[provider.id].visible) && (
          <p className="au-empty">All providers are hidden. Change this in Settings.</p>
        )}
      </div>

      <footer className="au-footer">
        <a className="au-footer__link" href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
          {msg('sourceCode')}
        </a>
        <span aria-hidden="true">·</span>
        <span>{msg('github')}</span>
        <span aria-hidden="true">·</span>
        {POSTHOG_PROJECT_TOKEN ? (
          <button type="button" className="au-footer__button" onClick={() => setReportOpen(true)}>
            <MessageSquareWarning aria-hidden="true" size={12} strokeWidth={1.8} />
            {msg('reportProblem')}
          </button>
        ) : (
          <a className="au-footer__link" href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer">
            {msg('reportProblem')}
          </a>
        )}
      </footer>

      {reportOpen && <ReportDialog onSend={sendReport} onClose={() => setReportOpen(false)} />}
    </main>
  );
};
