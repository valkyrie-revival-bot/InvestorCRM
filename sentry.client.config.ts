import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Disable in development
  enabled: process.env.NODE_ENV === 'production',

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out errors
  beforeSend(event, hint) {
    // Don't send browser extension errors
    if (event.exception?.values?.some(ex =>
      ex.value?.includes('Extension context') ||
      ex.value?.includes('chrome-extension') ||
      ex.value?.includes('moz-extension')
    )) {
      return null;
    }
    return event;
  },
});
