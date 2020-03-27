import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';

import { LabelWithSpinner } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';
import { Task } from '@/store/tasks/reducer';
import { ORG_TYPES, OrgTypes } from '@/utils/constants';

const OrgActions = ({
  org,
  type,
  task,
  ownedByCurrentUser,
  assignedToCurrentUser,
  ownedByWrongUser,
  reviewOrgOutOfDate,
  readyForReview,
  isCreating,
  isDeleting,
  isRefreshingOrg,
  isSubmittingReview,
  openSubmitReviewModal,
  doCreateOrg,
  doDeleteOrg,
  doRefreshOrg,
}: {
  org: Org | null;
  type: OrgTypes;
  task: Task;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser: boolean;
  ownedByWrongUser: Org | null;
  reviewOrgOutOfDate: boolean;
  readyForReview: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isRefreshingOrg: boolean;
  isSubmittingReview: boolean;
  openSubmitReviewModal: () => void;
  doCreateOrg: () => void;
  doDeleteOrg: () => void;
  doRefreshOrg: () => void;
}) => {
  if (isCreating) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Creating Org…')} />}
        disabled
      />
    );
  }

  if (isRefreshingOrg) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Refreshing Org…')} />}
        disabled
      />
    );
  }

  if (isSubmittingReview) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Submitting Review…')} />}
        disabled
      />
    );
  }

  if (isDeleting) {
    return null;
  }

  let submitReviewBtn = null;

  if (readyForReview) {
    if (task.review_valid) {
      submitReviewBtn = (
        <Button
          label={i18n.t('Update Review')}
          variant="outline-brand"
          className="slds-m-right_x-small"
          onClick={openSubmitReviewModal}
        />
      );
    } else if (org?.has_been_visited) {
      submitReviewBtn = (
        <Button
          label={i18n.t('Submit Review')}
          variant="outline-brand"
          className="slds-m-right_x-small"
          onClick={openSubmitReviewModal}
        />
      );
    }
  }

  if (ownedByCurrentUser && (org || ownedByWrongUser)) {
    return (
      <>
        {reviewOrgOutOfDate && (
          <Button
            label={i18n.t('Refresh Org')}
            variant="brand"
            className="slds-m-right_x-small"
            onClick={doRefreshOrg}
          />
        )}
        {submitReviewBtn}
        <Dropdown
          align="right"
          assistiveText={{ icon: i18n.t('Org Actions') }}
          buttonClassName="slds-button_icon-x-small"
          buttonVariant="icon"
          iconCategory="utility"
          iconName="down"
          iconSize="small"
          iconVariant="border-filled"
          width="xx-small"
          options={[{ id: 0, label: i18n.t('Delete Org') }]}
          onSelect={doDeleteOrg}
        />
      </>
    );
  }

  if (assignedToCurrentUser && !(org || ownedByWrongUser)) {
    const preventReviewOrg =
      type === ORG_TYPES.QA && !task.has_unmerged_commits;
    return (
      <>
        {submitReviewBtn}
        {!preventReviewOrg && (
          <Button label={i18n.t('Create Org')} onClick={doCreateOrg} />
        )}
      </>
    );
  }

  return null;
};

export default OrgActions;
