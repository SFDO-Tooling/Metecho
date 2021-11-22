import Badge from '@salesforce/design-system-react/components/badge';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import { t } from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

const ReadonlyBadge = ({
  className,
  ...props
}: {
  className?: string;
  [key: string]: any;
}) => (
  <Tooltip
    content={
      <Trans i18nKey="readonlyUserHelp">
        This user does not have “push” access to the GitHub repository for this
        Project, and will not be able to contribute changes in Metecho. Contact
        an admin for the repository on GitHub to grant additional permissions.
      </Trans>
    }
    position="overflowBoundaryElement"
    align="top right"
    triggerClassName={classNames(
      'slds-col_bump-left',
      'slds-m-right_x-small',
      className,
    )}
    dialogClassName="modal-tooltip"
  >
    <span tabIndex={0} title={t('read-only')}>
      <Badge content={t('read-only')} {...props} />
    </span>
  </Tooltip>
);

export default ReadonlyBadge;
