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
  USER: 'user' as const,
  REPOSITORY: 'repository' as const,
  PROJECT: 'project' as const,
  TASK: 'task' as const,
  ORG: 'scratch_org' as const,
  COMMIT: 'scratch_org_commit' as const,
  TASK_PR: 'task_pr' as const,
  PROJECT_PR: 'project_pr' as const,
};

export const SHOW_PROJECT_COLLABORATORS = 'show_collaborators';

export const DEFAULT_ORG_CONFIG_NAME = 'dev';

export type OrgTypes = 'Dev' | 'QA';

export const ORG_TYPES = {
  DEV: 'Dev' as const,
  QA: 'QA' as const,
};

export type WebsocketActions = 'SUBSCRIBE' | 'UNSUBSCRIBE';

export const WEBSOCKET_ACTIONS = {
  SUBSCRIBE: 'SUBSCRIBE' as const,
  UNSUBSCRIBE: 'UNSUBSCRIBE' as const,
};

export type TaskStatuses = 'Planned' | 'In progress' | 'Completed';

export const TASK_STATUSES = {
  PLANNED: 'Planned' as const,
  IN_PROGRESS: 'In progress' as const,
  COMPLETED: 'Completed' as const,
};

export type ReviewStatuses = 'Approved' | 'Changes requested';

export const REVIEW_STATUSES = {
  APPROVED: 'Approved' as const,
  CHANGES_REQUESTED: 'Changes requested' as const,
};

export type ProjectStatuses = 'Planned' | 'In progress' | 'Review' | 'Merged';

export const PROJECT_STATUSES = {
  PLANNED: 'Planned' as const,
  IN_PROGRESS: 'In progress' as const,
  REVIEW: 'Review' as const,
  MERGED: 'Merged' as const,
};

export const LIST_CHANNEL_ID = 'list';
