export type ObjectTypes =
  | 'user'
  | 'repository'
  | 'project'
  | 'task'
  | 'scratch_org'
  | 'scratch_org_changeset'
  | 'scratch_org_commit';

export const OBJECT_TYPES = {
  USER: 'user' as 'user',
  REPOSITORY: 'repository' as 'repository',
  PROJECT: 'project' as 'project',
  TASK: 'task' as 'task',
  ORG: 'scratch_org' as 'scratch_org',
  CHANGESET: 'scratch_org_changeset' as 'scratch_org_changeset',
  COMMIT: 'scratch_org_commit' as 'scratch_org_commit',
};

export const GITHUB_REPO_PREFIX = 'https://www.github.com';

export type OrgTypes = 'Dev' | 'QA';

export const ORG_TYPES = {
  DEV: 'Dev' as 'Dev',
  QA: 'QA' as 'QA',
};

export type WebsocketActions = 'SUBSCRIBE' | 'UNSUBSCRIBE';

export const WEBSOCKET_ACTIONS = {
  SUBSCRIBE: 'SUBSCRIBE' as 'SUBSCRIBE',
  UNSUBSCRIBE: 'UNSUBSCRIBE' as 'UNSUBSCRIBE',
};
