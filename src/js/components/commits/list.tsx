import Avatar from '@salesforce/design-system-react/components/avatar';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import { format, formatDistanceToNow } from 'date-fns';
import i18n from 'i18next';
import React from 'react';

import { ExternalLink } from '@/components/utils';
import { Commit } from '@/store/tasks/reducer';

interface TableCellProps {
  [key: string]: any;
  item?: Commit;
}

const CommitTableCell = ({ item, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const shortSha = item.id.substring(0, 7);
  return (
    <DataTableCell {...props} title={item.id}>
      <ExternalLink url={item.url}>{shortSha}</ExternalLink>
    </DataTableCell>
  );
};
CommitTableCell.displayName = DataTableCell.displayName;

const AuthorTableCell = ({ item, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  let author = item.author.username;
  if (item.author.name && item.author.name !== author) {
    author = `${author} (${item.author.name})`;
  }
  return (
    <DataTableCell {...props} title={author}>
      <Avatar
        imgAlt={author}
        imgSrc={item.author.avatar_url}
        title={author}
        size="small"
      />
    </DataTableCell>
  );
};
AuthorTableCell.displayName = DataTableCell.displayName;

const TimestampTableCell = ({ item, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const timestamp = new Date(item.timestamp);
  return (
    <DataTableCell {...props} title={format(timestamp, 'PPpp')}>
      {formatDistanceToNow(timestamp, { addSuffix: true })}
    </DataTableCell>
  );
};
TimestampTableCell.displayName = DataTableCell.displayName;

const CommitList = ({ commits }: { commits: Commit[] }) =>
  commits.length ? (
    <>
      <h2
        className="slds-text-heading_medium
        slds-m-top_large
        slds-m-bottom_x-small"
      >
        Commit History
      </h2>
      <DataTable
        items={commits}
        id="task-commits-table"
        className="slds-table_header-hidden"
        fixedLayout
        noRowHover
      >
        <DataTableColumn
          key="sha"
          label={i18n.t('Commit')}
          property="id"
          primaryColumn
          truncate
          width="15%"
        >
          <CommitTableCell />
        </DataTableColumn>
        <DataTableColumn
          key="author"
          label={i18n.t('Author')}
          property="author"
          width="8%"
        >
          <AuthorTableCell />
        </DataTableColumn>
        <DataTableColumn
          key="message"
          label={i18n.t('Message')}
          property="message"
          truncate
          width="52%"
        />
        <DataTableColumn
          key="timestamp"
          label={i18n.t('Timestamp')}
          property="timestamp"
          truncate
          width="25%"
        >
          <TimestampTableCell />
        </DataTableColumn>
      </DataTable>
    </>
  ) : null;

export default CommitList;
