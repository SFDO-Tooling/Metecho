import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Changeset } from 'src/js/store/orgs/reducer';

interface Props {
  summary: Changeset[];
}
const CommitSuccessMessage = ({ summary }: Props) => (
  <div className="slds-p-around_large">
    <p className="slds-text-color_success slds-p-bottom_large">
      <Icon
        category="utility"
        name="check"
        assistiveText={{ label: i18n.t('Success') }}
        size="small"
      />
      {i18n.t('You have successfully captured 11 changes!')}
    </p>
    <p className="slds-p-bottom_large">
      <b>{i18n.t('There are 22 uncaptured changes remaining')}</b>
    </p>
    <Trans i18nKey="commitResultsSummary">
      Before you submit this task for review, would you like to continue
      capturing changes, or would you like to close this box and go back to the
      task page?
    </Trans>
  </div>
);
export default CommitSuccessMessage;
