import { SpinnerWrapper } from '_js/components/utils';
import { Org } from '_js/store/orgs/reducer';
import React from 'react';

const OrgSpinner = ({
  org,
  ownedByCurrentUser,
  isDeleting,
  isRefreshingChanges,
  isReassigningOrg,
  isConvertingOrg,
}: {
  org: Org | null;
  ownedByCurrentUser: boolean;
  isDeleting: boolean;
  isRefreshingChanges: boolean;
  isReassigningOrg?: boolean;
  isConvertingOrg?: boolean;
}) => {
  if (
    isDeleting ||
    isRefreshingChanges ||
    isReassigningOrg ||
    isConvertingOrg ||
    (ownedByCurrentUser && org?.currently_capturing_changes)
  ) {
    return <SpinnerWrapper size="small" />;
  }
  return null;
};

export default OrgSpinner;
