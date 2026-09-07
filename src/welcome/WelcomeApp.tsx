import { msg } from '../shared/i18n';
import { AmbientBackground } from './components/AmbientBackground';
import { ToolbarPointer } from './components/ToolbarPointer';
import { TopBar } from './components/TopBar';
import { StepPin } from './steps/StepPin';
import { STAGE_KEYFRAMES, THEME_VARS } from './theme';

export default function WelcomeApp() {
  const iconUrl = chrome.runtime.getURL('icons/icon-128.png');
  const videoUrl = chrome.runtime.getURL('onboarding.webp');

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[var(--w-bg)] text-[var(--w-text)] [-webkit-font-smoothing:antialiased]"
      style={{
        ...THEME_VARS,
        fontFamily: "'Sohne', 'Avenir Next', 'IBM Plex Sans', 'Segoe UI', sans-serif",
      }}
    >
      <style>{STAGE_KEYFRAMES}</style>
      <AmbientBackground />
      <TopBar iconUrl={iconUrl} title={msg('appShortName')} />
      <div className="hidden lg:block">
        <ToolbarPointer />
      </div>
      <main className="relative z-10 min-h-screen flex items-center justify-center px-5 py-24 sm:px-8 lg:px-12">
        <div className="welcome-stage w-full">
          <StepPin videoUrl={videoUrl} onDone={() => window.close()} />
        </div>
      </main>
    </div>
  );
}
