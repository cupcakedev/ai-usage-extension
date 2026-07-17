import claudeBrandAsset from '../assets/brands/claude-anthropic.jpg';
import codexBrandAsset from '../assets/brands/codex-openai.jpg';
import { msg } from '../shared/i18n';
import { useNow } from '../shared/hooks/useNow';
import { ProviderCard } from './components/ProviderCard';
import { useUsageData } from './hooks/useUsageData';
import './styles/global.css';

export const App = () => {
  const {
    usage,
    claudeOverlayEnabled,
    codexOverlayEnabled,
    loading,
    refreshing,
    error,
    refresh,
    setClaudeOverlayEnabled,
    setCodexOverlayEnabled,
  } = useUsageData();
  const now = useNow(30_000);

  const initialLoading = loading && !usage.claude && !usage.codex;

  return (
    <main className="au-shell">
      <header className="au-topbar">
        <div>
          <h2 className="au-title">{msg('popupTitle')}</h2>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className={`au-btn-refresh ${refreshing ? 'au-btn-refresh--spin' : ''}`}
          title={msg('refreshUsage')}
          aria-label={msg('refreshUsage')}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="au-icon-refresh"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <polyline points="21 3 21 8 16 8" />
          </svg>
        </button>
      </header>

      {error && (
        <p className="au-error" role="alert">
          {msg('refreshErrorPrefix')} - {error}
        </p>
      )}

      <div className="au-global-controls">
        <div className="au-overlay-toggle">
          <p className="au-overlay-toggle__label">{msg('overlayToggleLabel')}</p>
          <label className="au-switch" aria-label={msg('overlayToggleLabel')}>
            <input
              type="checkbox"
              checked={claudeOverlayEnabled || codexOverlayEnabled}
              onChange={(event) => {
                const checked = event.target.checked;
                setClaudeOverlayEnabled(checked);
                setCodexOverlayEnabled(checked);
              }}
            />
            <span className="au-switch__slider" />
          </label>
        </div>
      </div>

      <div className="au-cards">
        <ProviderCard
          title="Claude"
          iconSrc={claudeBrandAsset}
          iconAlt="Claude by Anthropic"
          usage={usage.claude}
          loading={initialLoading}
          now={now}
          emptyHint={msg('emptyClaude')}
        />
        <ProviderCard
          title="Codex"
          iconSrc={codexBrandAsset}
          iconAlt="OpenAI"
          usage={usage.codex}
          loading={initialLoading}
          now={now}
          emptyHint={msg('emptyCodex')}
        />
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
