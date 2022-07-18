import React from 'react';

import { SpinnerWrapper } from '@/js/components/utils';
import { Org } from '@/js/store/orgs/reducer';

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
    (ownedByCurrentUser &&
      (org?.currently_retrieving_metadata || org?.currently_retrieving_dataset))
  ) {
    return <SpinnerWrapper size="small" />;
  }
  return null;
};

export default OrgSpinner;
