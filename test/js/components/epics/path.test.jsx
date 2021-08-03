import React from 'react';

import EpicStatusPath from '@/js/components/epics/path';
import { EPIC_STATUSES } from '@/js/utils/constants';

import { render } from './../../utils';

const defaultEpic = {
  status: EPIC_STATUSES.PLANNED,
};

describe('<EpicStatusPath />', () => {
  test.each([
    ['planned', {}],
    ['in progress', { status: EPIC_STATUSES.IN_PROGRESS }],
    ['all tasks complete', { status: EPIC_STATUSES.REVIEW }],
    ['pr opened', { status: EPIC_STATUSES.REVIEW, pr_is_open: true }],
    ['merged', { status: EPIC_STATUSES.MERGED }],
  ])('renders steps from epic status: %s', (name, opts) => {
    const epic = { ...defaultEpic, ...opts };
    const { container } = render(
      <EpicStatusPath status={epic.status} prIsOpen={epic.pr_is_open} />,
    );

    expect(container).toMatchSnapshot();
  });
});
