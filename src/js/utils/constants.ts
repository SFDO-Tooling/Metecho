export type ObjectTypes =
  | 'user'
  | 'repository'
  | 'project'
  | 'task'
  | 'scratch_org'
  | 'scratch_org_commit'
  | 'task_pr'
  | 'project_pr';

export const OBJECT_TYPES = {
  USER: 'user' as 'user',
  REPOSITORY: 'repository' as 'repository',
  PROJECT: 'project' as 'project',
  TASK: 'task' as 'task',
  ORG: 'scratch_org' as 'scratch_org',
  COMMIT: 'scratch_org_commit' as 'scratch_org_commit',
  TASK_PR: 'task_pr' as 'task_pr',
  PROJECT_PR: 'project_pr' as 'project_pr',
};

export const GITHUB_REPO_PREFIX = 'https://github.com';

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

export type TaskStatuses = 'Planned' | 'In progress' | 'Completed';

export const TASK_STATUSES = {
  PLANNED: 'Planned' as 'Planned',
  IN_PROGRESS: 'In progress' as 'In progress',
  COMPLETED: 'Completed' as 'Completed',
};

export const REVIEW_STATUS = {
  APPROVE: 'Approve' as 'Approve',
  REQUEST_CHANGES: 'Request Changes' as 'Request Changes',
};
