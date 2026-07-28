import claudeBrandAsset from '../assets/brands/claude-anthropic.jpg';
import codexBrandAsset from '../assets/brands/codex-openai.jpg';
import cursorBrandAsset from '../assets/brands/cursor.webp';
import kimiBrandAsset from '../assets/brands/kimi.webp';
import minimaxBrandAsset from '../assets/brands/minimax.webp';
import mimoBrandAsset from '../assets/brands/xiaomimimo.webp';
import { RefreshCw, Settings } from 'lucide-react';
import { msg } from '../shared/i18n';
import { useNow } from '../shared/hooks/useNow';
import type { ProviderId } from '../shared/types';
import { ProviderCard } from './components/ProviderCard';
import { useUsageData } from './hooks/useUsageData';
import './styles/global.css';

const PROVIDERS: Array<{
  id: ProviderId;
  title: string;
  iconSrc: string;
  iconAlt: string;
  emptyHint: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}> = [
  {
    id: 'claude',
    title: 'Claude',
    iconSrc: claudeBrandAsset,
    iconAlt: 'Claude by Anthropic',
    emptyHint: msg('emptyClaude'),
  },
  {
    id: 'codex',
    title: 'Codex',
    iconSrc: codexBrandAsset,
    iconAlt: 'OpenAI',
    emptyHint: msg('emptyCodex'),
  },
  {
    id: 'minimax',
    title: 'MiniMax',
    iconSrc: minimaxBrandAsset,
    iconAlt: 'MiniMax',
    emptyHint: msg('emptyMiniMax'),
  },
  {
    id: 'kimi',
    title: 'Kimi Code',
    iconSrc: kimiBrandAsset,
    iconAlt: 'Kimi',
    emptyHint: msg('emptyKimi'),
  },
  {
    id: 'cursor',
    title: 'Cursor',
    iconSrc: cursorBrandAsset,
    iconAlt: 'Cursor',
    emptyHint: msg('emptyCursor'),
    primaryLabel: msg('planUsage'),
    secondaryLabel: '',
  },
  {
    id: 'mimo',
    title: 'Xiaomi MiMo',
    iconSrc: mimoBrandAsset,
    iconAlt: 'Xiaomi MiMo',
    emptyHint: msg('emptyMiMo'),
    primaryLabel: msg('tokenPlan'),
    secondaryLabel: '',
  },
];

export const App = () => {
  const { usage, settings, loading, refreshing, error, refresh } = useUsageData();
  const now = useNow(30_000);

  const initialLoading =
    loading &&
    !usage.claude &&
    !usage.codex &&
    !usage.minimax &&
    !usage.kimi &&
    !usage.cursor &&
    !usage.mimo;

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
              loading={initialLoading}
              now={now}
              emptyHint={provider.emptyHint}
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
        <a
          className="au-footer__link"
          href="https://github.com/cupcakedev/ai-usage-extension"
          target="_blank"
          rel="noreferrer"
        >
          {msg('sourceCode')}
        </a>
        <span aria-hidden="true">·</span>
        <span>{msg('github')}</span>
      </footer>
    </main>
  );
};
