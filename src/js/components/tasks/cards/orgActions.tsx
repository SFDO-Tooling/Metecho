import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import i18n from 'i18next';
import React from 'react';

import { LabelWithSpinner } from '@/components/utils';
import { Org } from '@/store/orgs/reducer';
import { Task } from '@/store/tasks/reducer';

const OrgActions = ({
  org,
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

  if (
    readyForReview &&
    !reviewOrgOutOfDate &&
    assignedToCurrentUser &&
    (!org || ownedByCurrentUser)
  ) {
    if (task.review_valid) {
      submitReviewBtn = (
        <Button
          label={i18n.t('Update Review')}
          variant="outline-brand"
          className="slds-m-right_small"
          onClick={openSubmitReviewModal}
        />
      );
    } else if (org?.has_been_visited) {
      submitReviewBtn = (
        <Button
          label={i18n.t('Submit Review')}
          variant="outline-brand"
          className="slds-m-right_small"
          onClick={openSubmitReviewModal}
        />
      );
    } else {
      /* istanbul ignore else */
      // eslint-disable-next-line no-lonely-if
      if (org && ownedByCurrentUser) {
        submitReviewBtn = (
          <Tooltip
            content={i18n.t('View your org before submitting a review.')}
            position="overflowBoundaryElement"
          >
            <Button
              label={i18n.t('Submit Review')}
              variant="outline-brand"
              className="slds-m-right_small"
              disabled
            />
          </Tooltip>
        );
      }
    }
  }

  if (ownedByWrongUser || (org && ownedByCurrentUser)) {
    return (
      <>
        {reviewOrgOutOfDate && ownedByCurrentUser && (
          <Button
            label={i18n.t('Refresh Org')}
            variant="brand"
            className="slds-m-right_small"
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

  if (!org && assignedToCurrentUser) {
    return (
      <>
        {submitReviewBtn}
        <Button label={i18n.t('Create Org')} onClick={doCreateOrg} />
      </>
    );
  }

  return null;
};

export default OrgActions;
