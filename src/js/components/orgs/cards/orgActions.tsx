import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import TourPopover from '~js/components/tour/popover';
import { LabelWithSpinner } from '~js/components/utils';
import { Org } from '~js/store/orgs/reducer';
import { Task } from '~js/store/tasks/reducer';
import { ORG_TYPES, OrgTypes, REVIEW_STATUSES } from '~js/utils/constants';

const OrgActions = ({
  org,
  type,
  task,
  disableCreation,
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
  openContributeModal,
}: {
  org: Org | null;
  type: OrgTypes;
  task?: Task;
  disableCreation: boolean;
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
  openContributeModal?: () => void;
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

  let contributeBtn = null;
  const orgHasChanges =
    (org?.total_unsaved_changes || 0) - (org?.total_ignored_changes || 0) > 0;
  if (
    org &&
    ownedByCurrentUser &&
    orgHasChanges &&
    type === ORG_TYPES.PLAYGROUND &&
    openContributeModal
  ) {
    contributeBtn = (
      <Button
        label={i18n.t('Contribute Work')}
        variant="outline-brand"
        className="slds-m-right_x-small"
        onClick={openContributeModal}
      />
    );
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
        {contributeBtn}
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
    let popover = null;

    switch (type) {
      case ORG_TYPES.DEV:
        isActive = hasReviewRejected || !task.has_unmerged_commits;
        popover = (
          <TourPopover
            align="top"
            heading={i18n.t('Create a Dev Org')}
            body={
              <Trans i18nKey="tourTaskCreateDevOrg">
                A Dev Org is a temporary Salesforce org where you can make
                changes that you would like to contribute to the Project. To
                create an Org, make sure you are connected to a Salesforce
                account with Dev Hub enabled. Use the drop down menu to delete
                the Dev Org when you no longer need it.
              </Trans>
            }
          />
        );

        break;
      case ORG_TYPES.QA:
        isActive = needsReview;
        popover = (
          <TourPopover
            align="top"
            heading={i18n.t('Create a Test Org')}
            body={
              <Trans i18nKey="tourTaskCreateTestOrg">
                A Test Org is a temporary Salesforce org where you can view the
                changes the Developer retrieved. To create an Org, make sure you
                are connected to a Salesforce account with Dev Hub enabled. Read
                the Developer’s Commit History to see what changes they made.
                Use the drop down menu to delete the Test Org when you no longer
                need it.
              </Trans>
            }
          />
        );
        break;
    }
    return (
      <>
        {submitReviewBtn ? (
          <span className="slds-is-relative inline-container">
            {submitReviewBtn}
            <TourPopover
              align="top"
              heading={i18n.t('Submit a review')}
              body={
                <Trans i18nKey="tourTaskSubmitReview">
                  When you’re finished viewing and testing all the changes, come
                  back to Metecho to leave your review. You will have the option
                  to approve the work or request changes. Clearly describe any
                  further changes you’d like the Developer to make.
                </Trans>
              }
            />
          </span>
        ) : null}
        {!(preventNewTestOrg || disableCreation) && (
          <span className="slds-is-relative inline-container">
            <Button
              label={i18n.t('Create Org')}
              variant={isActive ? 'brand' : 'neutral'}
              onClick={doCreateOrg}
            />
            {popover}
          </span>
        )}
      </>
    );
  }

  return null;
};

export default OrgActions;
