export const logError = (
  message: string | Error,
  data: { [key: string]: any } = {},
) => {
  if (window.Sentry) {
    window.Sentry.withScope((scope) => {
      scope.setExtras(data);
      /* istanbul ignore else */
      if (window.Sentry) {
        if (message instanceof Error) {
          window.Sentry.captureException(message);
        } else {
          window.Sentry.captureMessage(message);
        }
      }
    });
  }
  window.console.error(message, data);
};

export const log = (...args: any[]) => {
  window.console.info(...args);
};
