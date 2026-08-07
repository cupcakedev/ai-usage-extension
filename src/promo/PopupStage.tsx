import { RefreshCw, Settings } from 'lucide-react';
import { msg } from '@shared/i18n';
import type { PopupLayout, ProviderId } from '@shared/types';
import { ProviderCard } from '@sidepanel/components/ProviderCard';
import { COPY } from './copy';
import { NOW, providerById } from './fixtures';

interface PopupStageProps {
  layout: PopupLayout;
  providers: readonly ProviderId[];
}

export const PopupStage = ({ layout, providers }: PopupStageProps) => {
  const grid = layout === 'grid';

  return (
    <div className={`au-shell ${grid ? 'au-shell--grid' : ''}`}>
      <header className="au-topbar">
        <div>
          <p className="au-eyebrow">{COPY.panelEyebrow}</p>
          <h2 className="au-title">{msg('popupTitle')}</h2>
        </div>
        <div className="au-topbar__actions">
          <span className="au-btn-refresh">
            <Settings className="au-icon-refresh" aria-hidden="true" strokeWidth={1.5} />
          </span>
          <span className="au-btn-refresh">
            <RefreshCw className="au-icon-refresh" aria-hidden="true" strokeWidth={1.5} />
          </span>
        </div>
      </header>

      <div className="au-global-controls">
        <div className="au-overlay-toggle">
          <p className="au-overlay-toggle__label">{msg('optionsOverlaysTitle')}</p>
          <span className="au-switch">
            <input type="checkbox" checked readOnly aria-label={msg('optionsOverlaysTitle')} />
            <span className="au-switch__slider" />
          </span>
        </div>
      </div>

      <div className={`au-cards ${grid ? 'au-cards--grid' : ''}`}>
        {providers.map((id) => {
          const provider = providerById(id);
          return (
            <ProviderCard
              key={provider.id}
              title={provider.title}
              iconSrc={provider.iconSrc}
              iconAlt={provider.title}
              usage={provider.usage}
              loading={false}
              now={NOW}
              emptyHint=""
              metrics={provider.metrics}
              primaryLabel={provider.primaryLabel}
              secondaryLabel={provider.secondaryLabel}
            />
          );
        })}
      </div>
    </div>
  );
};
