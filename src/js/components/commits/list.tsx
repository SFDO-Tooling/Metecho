import { format, formatDistanceToNow } from 'date-fns';
import React from 'react';

import { ExternalLink } from '@/components/utils';
import { Commit } from '@/store/tasks/reducer';

const CommitList = ({ commits }: { commits: Commit[] }) => {
  const tableRows = commits.map((commit) => {
    const shortSha = commit.id.substring(0, 7);
    const timestamp = new Date(commit.timestamp);
    return (
      <tr key={shortSha}>
        <td>
          <ExternalLink url={commit.url}>{shortSha}</ExternalLink>
        </td>
        <td>
          <img src={commit.author.avatar_url} />
        </td>
        <td>{commit.message}</td>
        <td title={format(timestamp, 'PPpp')}>
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </td>
      </tr>
    );
  });
  return (
    <>
      <h2 className="slds-text-heading_medium">Commit History</h2>
      <table>
        <thead></thead>
        <tbody>{tableRows}</tbody>
      </table>
    </>
  );
};

export default CommitList;
