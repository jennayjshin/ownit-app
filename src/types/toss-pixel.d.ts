declare class TossPixel {
  constructor(trackingCode: string);
  adImpression(): void;
  pageView(params?: { custom_param1?: string; custom_param2?: string }): void;
  signIn(params?: { custom_param1?: string; custom_param2?: string }): void;
  custom(eventName: string, params?: Record<string, unknown>): void;
}
