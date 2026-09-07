import type { ExtensionMessage, MessageResponse } from '../types';
import type { AnalyticsContext, AnalyticsEventName, AnalyticsEvents } from './events';

export const trackFrom =
  (context: AnalyticsContext) =>
  async <Name extends AnalyticsEventName>(
    event: Name,
    properties: AnalyticsEvents[Name],
  ): Promise<boolean> => {
    const message: ExtensionMessage = { type: 'TRACK', context, event, properties };
    const response = (await chrome.runtime.sendMessage(message).catch(() => undefined)) as
      | MessageResponse<null>
      | undefined;

    return response?.success === true;
  };
