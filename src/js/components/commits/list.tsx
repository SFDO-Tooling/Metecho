import React from 'react';

import { Commit, Task } from '@/store/tasks/reducer';

const CommitList = ({ task, commits }: { task: Task; commits: Commit[] }) => {
  if (!task.branch_url) {
    return null;
  }
  const baseUrl = new URL(task.branch_url);
  const basePath = baseUrl.pathname
    .split('/')
    .slice(0, 3)
    .join('/');
  baseUrl.pathname = basePath;
  const baseUrlString = baseUrl.toString();
  const tableRows = commits.map((commit) => {
    const shortSha = commit.sha.slice(0, 7);
    const commitLink = `${baseUrlString}/commit/${commit.sha}`;
    // TODO: make this humanized and relative:
    const relativeTimestamp = commit.timestamp;
    return (
      <tr key={shortSha}>
        <td>
          <a href={commitLink}>{shortSha}</a>
        </td>
        <td>
          <img src={commit.author.avatar_url} />
        </td>
        <td>{commit.message}</td>
        <td>{relativeTimestamp}</td>
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
