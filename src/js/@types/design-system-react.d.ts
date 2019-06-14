/* eslint-disable one-var */

declare module '@salesforce/design-system-react/components/*' {
  import * as React from 'react';

  const value: React.ComponentType<any>;
  export default value;
}

declare module '@salesforce/design-system-react/components/settings' {
  const settings: {
    setAssetsPaths: (path: string) => void;
    getAssetsPaths: () => string;
    setAppElement: (el: Element) => void;
    getAppElement: () => Element | undefined;
  };
  export default settings;
}
