/* eslint-disable one-var */

declare module '@salesforce/design-system-react/components/*' {
  import { ComponentType } from 'react';

  const value: ComponentType<any>;
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

declare module '@salesforce/design-system-react/components/combobox/filter' {
  type Option = {
    id: string;
    icon?: JSX.Element;
    label?: string;
    subTitle?: string;
    type?: string;
    disabled?: boolean;
    tooltipContent?: JSX.Element;
  };
  type Selection = {
    id: string;
    icon?: JSX.Element;
    label?: string;
    subTitle?: string;
    type?: string;
  };

  const filter: (opts: {
    inputValue: string;
    limit: number;
    options: Option[];
    selection: Selection[];
  }) => Option[];

  export default filter;
}
