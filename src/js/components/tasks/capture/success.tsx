import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

interface Props {
  summary: [number, number];
}
const CommitSuccessMessage = ({ summary }: Props) => {
  const [captured, uncaptured] = summary;
  return (
    <div className="slds-p-around_large">
      <p className="slds-text-color_success slds-p-bottom_large">
        <Icon
          category="utility"
          name="check"
          assistiveText={{ label: i18n.t('Success') }}
          size="small"
        />
        <Trans i18nKey="capturedChangesSummary">
          You have successfully captured {{ captured }} changes!
        </Trans>
      </p>
      <p className="slds-p-bottom_large">
        <Trans i18nKey="uncapturedChangesSummary">
          <b>There are {{ uncaptured }} uncaptured changes remaining</b>
        </Trans>
      </p>
      <Trans i18nKey="commitResultsSummary">
        Before you submit this task for review, would you like to continue
        capturing changes, or would you like to close this box and go back to
        the task page?
      </Trans>
    </div>
  );
};
export default CommitSuccessMessage;
