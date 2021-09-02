import React from 'react';
import { StaticRouter } from 'react-router-dom';

import { DetailPageLayout } from '@/js/components/utils';

import { renderWithRedux } from './../../utils';

describe('<DetailPageLayout />', () => {
  test('shows social img if no description', () => {
    const { getByAltText } = renderWithRedux(
      <StaticRouter context={{}}>
        <DetailPageLayout
          title="project-1"
          image="image-url"
          breadcrumb={[
            { name: 'project-1' },
            { name: 'test', url: '/foo', emphasis: true },
          ]}
          description=""
          repoUrl="repo-url"
        />
      </StaticRouter>,
      {
        user: {},
      },
    );

    expect(getByAltText('social image for project-1')).toBeDefined();
  });
});
