export type ObjectTypes =
  | 'user'
  | 'project'
  | 'epic'
  | 'task'
  | 'scratch_org'
  | 'scratch_org_commit'
  | 'task_pr'
  | 'epic_pr';

export const OBJECT_TYPES = {
  USER: 'user' as const,
  PROJECT: 'project' as const,
  EPIC: 'epic' as const,
  TASK: 'task' as const,
  ORG: 'scratch_org' as const,
  COMMIT: 'scratch_org_commit' as const,
  TASK_PR: 'task_pr' as const,
  EPIC_PR: 'epic_pr' as const,
};

export const DEFAULT_ORG_CONFIG_NAME = 'dev';

export const NULL_FILTER_VALUE = 'null';

export type OrgTypes = 'Dev' | 'QA' | 'Playground';

export const ORG_TYPES = {
  DEV: 'Dev' as const,
  QA: 'QA' as const,
  PLAYGROUND: 'Playground' as const,
};

export type WebsocketActions = 'SUBSCRIBE' | 'UNSUBSCRIBE';

export const WEBSOCKET_ACTIONS = {
  SUBSCRIBE: 'SUBSCRIBE' as const,
  UNSUBSCRIBE: 'UNSUBSCRIBE' as const,
};

export type TaskStatuses = 'Planned' | 'In progress' | 'Completed' | 'Canceled';

export const TASK_STATUSES = {
  PLANNED: 'Planned' as const,
  IN_PROGRESS: 'In progress' as const,
  COMPLETED: 'Completed' as const,
  CANCELED: 'Canceled' as const,
};

export type ReviewStatuses = 'Approved' | 'Changes requested';

export const REVIEW_STATUSES = {
  APPROVED: 'Approved' as const,
  CHANGES_REQUESTED: 'Changes requested' as const,
};

export type EpicStatuses = 'Planned' | 'In progress' | 'Review' | 'Merged';

export const EPIC_STATUSES = {
  PLANNED: 'Planned' as const,
  IN_PROGRESS: 'In progress' as const,
  REVIEW: 'Review' as const,
  MERGED: 'Merged' as const,
};

export const LIST_CHANNEL_ID = 'list';

export type OrgParentType = 'TASK' | 'EPIC' | 'PROJECT';

export type WalkthroughType = 'play' | 'help' | 'plan';
export const WALKTHROUGH_TYPES = {
  PLAY: 'play' as const,
  HELP: 'help' as const,
  PLAN: 'plan' as const,
};

export const SHOW_WALKTHROUGH = 'show_walkthrough';

export type ConfirmOrgTracker = 'delete' | 'refresh' | null;

export const CONFIRM_ORG_TRACKER = {
  DELETE: 'delete' as const,
  REFRESH: 'refresh' as const,
};

export const RETRIEVE_CHANGES = 'retrieve_changes';
