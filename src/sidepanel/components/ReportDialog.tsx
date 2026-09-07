import { useEffect, useRef, useState } from 'react';
import { Check, ExternalLink, Send, X } from 'lucide-react';

import { GITHUB_ISSUES_URL, REPORT_MAX_LENGTH } from '../../shared/constants';
import { msg } from '../../shared/i18n';

type Phase = 'editing' | 'sending' | 'sent' | 'failed';

export interface ReportDialogProps {
  onSend: (message: string) => Promise<boolean>;
  onClose: () => void;
}

export const ReportDialog = ({ onSend, onClose }: ReportDialogProps) => {
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<Phase>('editing');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (phase !== 'sent') return;
    const timer = setTimeout(onClose, 1600);
    return () => clearTimeout(timer);
  }, [phase, onClose]);

  const trimmed = message.trim();

  const submit = (): void => {
    if (!trimmed || phase === 'sending' || phase === 'sent') return;

    setPhase('sending');
    void onSend(trimmed.slice(0, REPORT_MAX_LENGTH)).then((sent) =>
      setPhase(sent ? 'sent' : 'failed'),
    );
  };

  return (
    <div className="au-modal" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={msg('reportTitle')}
        className="au-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="au-modal__head">
          <div>
            <p className="au-modal__title">{msg('reportTitle')}</p>
            <p className="au-modal__hint">{msg('reportDescription')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="au-modal__close"
            aria-label={msg('reportCancel')}
          >
            <X aria-hidden="true" size={14} strokeWidth={2} />
          </button>
        </div>

        {phase === 'sent' ? (
          <p className="au-modal__done">
            <Check aria-hidden="true" size={14} strokeWidth={2} />
            {msg('reportSent')}
          </p>
        ) : (
          <>
            <textarea
              ref={inputRef}
              value={message}
              maxLength={REPORT_MAX_LENGTH}
              rows={4}
              placeholder={msg('reportPlaceholder')}
              disabled={phase === 'sending'}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit();
              }}
              className="au-modal__input"
            />

            {phase === 'failed' ? (
              <p className="au-modal__error" role="alert">
                {msg('reportFailed')}{' '}
                <a
                  className="au-footer__link"
                  href={GITHUB_ISSUES_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {msg('reportOnGithub')}
                  <ExternalLink aria-hidden="true" size={11} strokeWidth={2} />
                </a>
              </p>
            ) : (
              <p className="au-modal__meta">
                <span>{msg('reportPrivacy')}</span>
                <span className="au-modal__count">
                  {message.length}/{REPORT_MAX_LENGTH}
                </span>
              </p>
            )}

            <div className="au-modal__actions">
              <button type="button" onClick={onClose} className="au-modal__btn">
                {msg('reportCancel')}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!trimmed || phase === 'sending'}
                className="au-modal__btn au-modal__btn--primary"
              >
                <Send aria-hidden="true" size={13} strokeWidth={2} />
                {phase === 'sending' ? msg('reportSending') : msg('reportSend')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
