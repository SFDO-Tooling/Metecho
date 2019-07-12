import * as Sentry from '@sentry/browser';

let config;
try {
  const el = document.getElementById('js-sentry-setup');
  if (el && el.innerHTML) {
    config = JSON.parse(el.innerHTML);
  }
} catch (err) {
  // Error-logging is not available, but it's not worth throwing an Error
  // and stopping execution. Intentionally swallow Error and continue.
}

if (config && config.dsn) {
  window.Sentry = Sentry;

  // Configure Sentry
  Sentry.init({ dsn: config.dsn });
}
