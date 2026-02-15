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

  // Filter out errors
  beforeSend(event, hint) {
    // Don't send internal errors in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },
});
