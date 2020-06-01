import { render } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import { DetailPageLayout } from '@/components/utils';

describe('<DetailPageLayout />', () => {
  test('shows social img if no description', () => {
    const { getByAltText } = render(
      <StaticRouter context={{}}>
        <DetailPageLayout
          title="repo-1"
          image="image-url"
          breadcrumb={[{ name: 'repo-1', url: '' }]}
          description=""
          repoUrl="repo-url"
        />
      </StaticRouter>,
    );

    expect(getByAltText('social image for repo-1')).toBeDefined();
  });
});
