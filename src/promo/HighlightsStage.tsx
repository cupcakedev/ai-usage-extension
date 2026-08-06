import { KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { COPY, PROVIDER_HOSTS } from './copy';
import { PROVIDERS } from './fixtures';

const GLYPHS = [KeyRound, ShieldCheck, RefreshCw];

/**
 * Closing slide: the full provider lineup with the host each snapshot is read
 * from, plus the three claims that hold for all of them.
 */
export const HighlightsStage = () => (
  <div className="promo-highlights">
    <h2 className="promo-highlights__title">{COPY.highlights.title}</h2>

    <div className="promo-lineup">
      {PROVIDERS.map((provider) => (
        <div className="promo-lineup__row" key={provider.id}>
          <img src={provider.iconSrc} alt="" />
          <span className="promo-lineup__naming">
            <strong>{provider.title}</strong>
            <small>{PROVIDER_HOSTS[provider.id]}</small>
          </span>
        </div>
      ))}
    </div>

    <ul className="promo-highlights__list">
      {COPY.highlights.items.map((item, index) => {
        const Glyph = GLYPHS[index] ?? ShieldCheck;
        return (
          <li key={item.title}>
            <span className="promo-highlights__glyph" aria-hidden="true">
              <Glyph size={16} strokeWidth={1.9} />
            </span>
            <span className="promo-highlights__copy">
              <strong>{item.title}</strong>
              <small>{item.body}</small>
            </span>
          </li>
        );
      })}
    </ul>
  </div>
);
