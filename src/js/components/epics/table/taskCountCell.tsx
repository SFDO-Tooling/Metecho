import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';
import React from 'react';

import { TableCellProps } from '@/js/components/epics/table';

const taskCountTableCell = ({
  className,
  children,
  ...props
}: TableCellProps & { children?: number }) => (
  <DataTableCell
    {...props}
    className={classNames(className, 'numbers-cell', 'complex-cell')}
  >
    {children}
  </DataTableCell>
);

taskCountTableCell.displayName = DataTableCell.displayName;

export default taskCountTableCell;
