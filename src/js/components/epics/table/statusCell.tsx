import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import ProgressRing from '@salesforce/design-system-react/components/progress-ring';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';

import { TableCellProps } from '@/js/components/epics/table';
import { EPIC_STATUSES } from '@/js/utils/constants';

const StatusTableCell = ({ item, className, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const status = item.status;
  let display, icon;
  switch (status) {
    case EPIC_STATUSES.PLANNED:
      display = i18n.t('Planned');
      icon = <ProgressRing value={0} />;
      break;
    case EPIC_STATUSES.IN_PROGRESS:
      display = i18n.t('In Progress');
      icon = <ProgressRing value={40} flowDirection="fill" theme="active" />;
      break;
    case EPIC_STATUSES.REVIEW:
      display = i18n.t('Review');
      icon = <ProgressRing value={100} />;
      break;
    case EPIC_STATUSES.MERGED:
      display = i18n.t('Merged');
      icon = <ProgressRing value={100} theme="complete" hasIcon />;
      break;
  }
  return (
    <DataTableCell
      {...props}
      title={display || status}
      className={classNames(className, 'status-cell', 'complex-cell')}
    >
      {icon}
      <span className="slds-m-left_x-small status-cell-text">
        {display || status}
      </span>
    </DataTableCell>
  );
};
StatusTableCell.displayName = DataTableCell.displayName;

export default StatusTableCell;
