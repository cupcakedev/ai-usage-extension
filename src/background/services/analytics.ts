import { PostHog } from 'posthog-js/dist/module.no-external';

import { POSTHOG_HOST, POSTHOG_PROJECT_TOKEN } from '../../shared/constants';
import { sharedDistinctId } from '../../shared/analytics/distinctId';
import type {
  AnalyticsContext,
  AnalyticsEventName,
  AnalyticsEvents,
} from '../../shared/analytics/events';
import { readExtensionSettings } from '../../shared/settings';
import { UsageService } from './UsageService';
import type { ProviderId, UsageState } from '../../shared/types';

const manifestVersion = (): string => chrome.runtime.getManifest?.().version ?? 'unknown';

const uiLanguage = (): string => chrome.i18n?.getUILanguage?.() ?? 'unknown';

const browserVersion = (): string | undefined =>
  /Chrome\/([\d.]+)/.exec(globalThis.navigator?.userAgent ?? '')?.[1];

const providersWithData = (state: UsageState): ProviderId[] =>
  (Object.keys(state) as Array<keyof UsageState>).filter(
    (key): key is ProviderId => key !== 'issues' && Boolean(state[key]),
  );

const dynamicProperties = async (): Promise<Record<string, unknown>> => {
  const [settings, state] = await Promise.all([
    readExtensionSettings().catch(() => undefined),
    UsageService.getUsageState().catch(() => ({}) as UsageState),
  ]);

  return {
    ui_language: uiLanguage(),
    language_preference: settings?.language,
    popup_layout: settings?.popupLayout,
    visible_providers: settings
      ? Object.entries(settings.providers)
          .filter(([, provider]) => provider.visible)
          .map(([id]) => id)
      : undefined,
    connected_providers: providersWithData(state),
    provider_issues: Object.entries(state.issues ?? {}).map(([id, issue]) => `${id}:${issue}`),
  };
};

let startup: Promise<PostHog> | undefined;

const client = async (): Promise<PostHog> => {
  startup ??= (async () => {
    const distinctId = await sharedDistinctId();
    const posthog = new PostHog();
    posthog.init(POSTHOG_PROJECT_TOKEN as string, {
      api_host: POSTHOG_HOST,
      bootstrap: { distinctID: distinctId },
      defaults: '2026-08-29',
      persistence: 'memory',
      request_batching: false,
      advanced_disable_flags: true,
      disable_external_dependency_loading: true,
      disable_session_recording: true,
      disable_surveys: true,
      capture_pageview: false,
      capture_exceptions: false,
      autocapture: false,
      person_profiles: 'identified_only',
    });
    posthog.register({
      app_version: manifestVersion(),
      browser_version: browserVersion(),
    });
    return posthog;
  })();

  return startup;
};

export const isAnalyticsConfigured = (): boolean => Boolean(POSTHOG_PROJECT_TOKEN);

export const track = async <Name extends AnalyticsEventName>(
  event: Name,
  properties: AnalyticsEvents[Name],
  context: AnalyticsContext,
): Promise<boolean> => {
  if (!isAnalyticsConfigured()) return false;

  try {
    const posthog = await client();
    posthog.capture(event, { ...properties, ...(await dynamicProperties()), context });
    return true;
  } catch {
    return false;
  }
};
