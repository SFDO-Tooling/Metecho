import * as Sentry from '@sentry/browser';

import { Socket } from '_js/utils/websockets';

declare global {
  interface Window {
    GLOBALS: { [key: string]: any };
    Sentry?: typeof Sentry;
    api_urls: { [key: string]: (...args: any[]) => string };
    socket: Socket | null;
  }
}
