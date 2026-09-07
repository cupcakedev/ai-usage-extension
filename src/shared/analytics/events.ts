export type AnalyticsContext = 'popup' | 'options';

export interface AnalyticsEvents {
  problem_reported: {
    message: string;
    message_length: number;
  };
}

export type AnalyticsEventName = keyof AnalyticsEvents;
