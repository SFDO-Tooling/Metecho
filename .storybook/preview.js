import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import actionSprite from '@salesforce-ux/design-system/assets/icons/action-sprite/svg/symbols.svg';
import customSprite from '@salesforce-ux/design-system/assets/icons/custom-sprite/svg/symbols.svg';
import doctypeSprite from '@salesforce-ux/design-system/assets/icons/doctype-sprite/svg/symbols.svg';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import 'sass/app.scss';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
};

export const decorators = [
  (Story) => (
    <MemoryRouter>
      <IconSettings
        actionSprite={actionSprite}
        customSprite={customSprite}
        doctypeSprite={doctypeSprite}
        standardSprite={standardSprite}
        utilitySprite={utilitySprite}
      >
        <Story />
      </IconSettings>
    </MemoryRouter>
  ),
];
