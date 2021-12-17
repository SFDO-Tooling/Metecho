import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';
import React from 'react';

import { TableCellProps } from '@/js/components/epics/table';
import { getEpicStatus } from '@/js/components/utils';

const StatusTableCell = ({ item, className, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }

  const { status, icon } = getEpicStatus({
    epicStatus: item.status,
  });

  return (
    <DataTableCell
      {...props}
      title={status}
      className={classNames(className, 'status-cell', 'complex-cell')}
    >
      {icon}
      <span className="slds-m-left_x-small status-cell-text">{status}</span>
    </DataTableCell>
  );
};
StatusTableCell.displayName = DataTableCell.displayName;

export default StatusTableCell;
