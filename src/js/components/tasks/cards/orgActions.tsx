import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';

import { LabelWithSpinner } from '~js/components/utils';
import { Org } from '~js/store/orgs/reducer';
import { Task } from '~js/store/tasks/reducer';
import { ORG_TYPES, OrgTypes, REVIEW_STATUSES } from '~js/utils/constants';

const OrgActions = ({
  org,
  type,
  task,
  ownedByCurrentUser,
  assignedToCurrentUser,
  ownedByWrongUser,
  orgOutOfDate,
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
  task?: Task;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser?: boolean;
  ownedByWrongUser?: Org | null;
  orgOutOfDate?: boolean;
  readyForReview?: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isRefreshingOrg?: boolean;
  isSubmittingReview?: boolean;
  openSubmitReviewModal?: () => void;
  doCreateOrg?: () => void;
  doDeleteOrg: () => void;
  doRefreshOrg?: () => void;
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
    if (task?.review_valid) {
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
        {orgOutOfDate && doRefreshOrg ? (
          <Button
            label={i18n.t('Refresh Org')}
            variant="brand"
            className="slds-m-horizontal_x-small"
            onClick={doRefreshOrg}
          />
        ) : null}
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

  if (task && assignedToCurrentUser && !(org || ownedByWrongUser)) {
    const preventNewTestOrg =
      type === ORG_TYPES.QA && !task.has_unmerged_commits;
    const hasReviewRejected =
      task.review_valid &&
      task.review_status === REVIEW_STATUSES.CHANGES_REQUESTED;
    const needsReview =
      task.has_unmerged_commits && task.pr_is_open && !task.review_valid;
    let isActive = false;
    switch (type) {
      case ORG_TYPES.DEV:
        isActive = hasReviewRejected || !task.has_unmerged_commits;
        break;
      case ORG_TYPES.QA:
        isActive = needsReview;
        break;
    }
    return (
      <>
        {submitReviewBtn}
        {!preventNewTestOrg && (
          <Button
            label={i18n.t('Create Org')}
            variant={isActive ? 'brand' : 'neutral'}
            onClick={doCreateOrg}
          />
        )}
      </>
    );
  }

  return null;
};

export default OrgActions;
