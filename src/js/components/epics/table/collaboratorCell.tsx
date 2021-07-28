import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';
import React from 'react';

import { TableCellProps } from '@/js/components/epics/table';

const CollaboratorTableCell = ({
  className,
  children,
  ...props
}: TableCellProps & { children?: number }) => (
  <DataTableCell
    {...props}
    className={classNames(
      className,
      'epic-collaborators-cell',
      'numbers-cell',
      'complex-cell',
    )}
  >
    {children}
  </DataTableCell>
);
CollaboratorTableCell.displayName = DataTableCell.displayName;

export default CollaboratorTableCell;
