import React from 'react';

import { ExternalLink } from '@/js/components/utils';

import { render } from '../../utils';

describe('<ExternalLink />', () => {
  test('renders with defaults', () => {
    const { getByText } = render(
      <ExternalLink url="testurl">test link</ExternalLink>,
    );
    expect(getByText('test link')).toBeVisible();
  });

  test('renders with new-tab icon', () => {
    const { getByText } = render(
      <ExternalLink url="testurl" showButtonIcon>
        test link
      </ExternalLink>,
    );

    expect(getByText('test link')).toBeVisible();
    expect(getByText('Opens in new tab')).toBeVisible();
  });

  test('renders with Github icon', () => {
    const { container } = render(
      <ExternalLink url="testurl" showGitHubIcon>
        test link
      </ExternalLink>,
    );

    expect(container.querySelector('[href$=github]')).toBeVisible();
  });
});
