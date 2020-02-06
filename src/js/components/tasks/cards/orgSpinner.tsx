import React from 'react';

import { SpinnerWrapper } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';

const OrgSpinner = ({
  org,
  ownedByCurrentUser,
  isDeleting,
  isRefreshingChanges,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
  isRefreshingChanges: boolean;
}) => {
  if (
    isDeleting ||
    isRefreshingChanges ||
    (ownedByCurrentUser && org?.currently_capturing_changes)
  ) {
    return <SpinnerWrapper size="small" />;
  }
  return null;
};

export default OrgSpinner;
