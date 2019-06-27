/* eslint-disable @typescript-eslint/no-unused-vars */

import * as CSS from 'csstype';

declare module 'csstype' {
  interface Properties {
    // Add a CSS Custom Property
    '--custom-color'?: string;
  }
}
