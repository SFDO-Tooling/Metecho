import React from 'react';

import { SpinnerWrapper } from '~js/components/utils';
import { Org } from '~js/store/orgs/reducer';

const OrgSpinner = ({
  org,
  ownedByCurrentUser,
  isDeleting,
  isRefreshingChanges,
  isReassigningOrg,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
  isRefreshingChanges: boolean;
  isReassigningOrg?: boolean;
}) => {
  if (
    isDeleting ||
    isRefreshingChanges ||
    isReassigningOrg ||
    (ownedByCurrentUser && org?.currently_capturing_changes)
  ) {
    return <SpinnerWrapper size="small" />;
  }
  return null;
};

export default OrgSpinner;
