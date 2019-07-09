import { RavenStatic } from 'raven-js';

import { Socket } from '@/utils/websockets';

declare global {
  interface Window {
    GLOBALS: { [key: string]: any };
    Raven?: RavenStatic;
    api_urls: { [key: string]: (...args: any[]) => string };
    socket: Socket | null;
  }
}
