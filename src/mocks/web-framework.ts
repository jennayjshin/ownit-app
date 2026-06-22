const initializeFn = () => {};
(initializeFn as unknown as { isSupported: () => boolean }).isSupported = () => false;

export const TossAds = {
  initialize: initializeFn as typeof initializeFn & { isSupported: () => boolean },
  attachBanner: () => ({ destroy: () => {} }),
};

export const Analytics = {
  screen: (..._args: unknown[]) => {},
  click: (..._args: unknown[]) => {},
};

export const requestNotificationAgreement = () => () => {};

export const appLogin = async () => ({ authorizationCode: "dev", referrer: "" });

// Required by @toss/tds-mobile-ait
export const getAppsInTossGlobals = () => ({});
export const getSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
