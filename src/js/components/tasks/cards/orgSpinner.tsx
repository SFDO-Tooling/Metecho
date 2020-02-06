import React from 'react';

import { SpinnerWrapper } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';

const OrgSpinner = ({
  org,
  ownedByCurrentUser,
  isDeleting,
  isRefreshingChanges,
  isRefreshingOrg,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
  isRefreshingChanges: boolean;
  isRefreshingOrg: boolean;
}) => {
  if (
    isDeleting ||
    isRefreshingChanges ||
    isRefreshingOrg ||
    (ownedByCurrentUser && org?.currently_capturing_changes)
  ) {
    return <SpinnerWrapper size="small" />;
  }
  return null;
};

export default OrgSpinner;
