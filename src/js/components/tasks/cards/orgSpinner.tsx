import React from 'react';

import { SpinnerWrapper } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';

const OrgSpinner = ({
  org,
  ownedByCurrentUser,
  isDeleting,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
}) => {
  if (
    (org && isDeleting) ||
    (ownedByCurrentUser &&
      (org?.currently_capturing_changes || org?.currently_refreshing_changes))
  ) {
    return <SpinnerWrapper size="small" />;
  }
  return null;
};

export default OrgSpinner;
