import * as React from 'react';
import * as i18nReact from 'react-i18next';

// Fix for: https://github.com/i18next/react-i18next/issues/1483
declare module 'react-i18next' {
  type TransChild = React.ReactNode | Record<string, unknown>;

  interface TransOptions
    extends Omit<i18nReact.TransProps<string>, 'children'> {
    children?: TransChild | TransChild[];
  }

  export function Trans(props: TransOptions): React.ReactElement;
}
