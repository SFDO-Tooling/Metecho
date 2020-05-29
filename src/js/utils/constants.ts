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

export const SHOW_PROJECT_COLLABORATORS = 'show_collaborators';

export type OrgTypes = 'Dev' | 'QA';

export type OrgConfigs = 'Dev' | 'QA' | 'BETA' | 'RELEASE';

export const ORG_TYPES = {
  DEV: 'Dev' as 'Dev',
  QA: 'QA' as 'QA',
};

export const ORG_CONFIGS = {
  DEV: 'Dev' as 'Dev',
  QA: 'QA' as 'QA',
  BETA: 'Beta' as 'Beta',
  RELEASE: 'Release' as 'Release',
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

export type ReviewStatuses = 'Approved' | 'Changes requested';

export const REVIEW_STATUSES = {
  APPROVED: 'Approved' as 'Approved',
  CHANGES_REQUESTED: 'Changes requested' as 'Changes requested',
};

export type ProjectStatuses = 'Planned' | 'In progress' | 'Review' | 'Merged';

export const PROJECT_STATUSES = {
  PLANNED: 'Planned' as 'Planned',
  IN_PROGRESS: 'In progress' as 'In progress',
  REVIEW: 'Review' as 'Review',
  MERGED: 'Merged' as 'Merged',
};
