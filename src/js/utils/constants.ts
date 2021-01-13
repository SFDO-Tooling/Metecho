import i18n from 'i18next';

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

export const SHOW_EPIC_COLLABORATORS = 'show_collaborators';

export const DEFAULT_ORG_CONFIG_NAME = 'dev';

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

export type EpicStatuses = 'Planned' | 'In progress' | 'Review' | 'Merged';

export const EPIC_STATUSES = {
  PLANNED: 'Planned' as const,
  IN_PROGRESS: 'In progress' as const,
  REVIEW: 'Review' as const,
  MERGED: 'Merged' as const,
};

export const LIST_CHANNEL_ID = 'list';

export type OrgParentType = 'TASK' | 'EPIC' | 'PROJECT';

export const getOrgMessages = () => ({
  CREATED: {
    [ORG_TYPES.DEV]: i18n.t('Successfully created Dev Org.'),
    [ORG_TYPES.QA]: i18n.t('Successfully created Test Org.'),
    [ORG_TYPES.PLAYGROUND]: i18n.t('Successfully created Playground Org.'),
    TASK: {
      [ORG_TYPES.DEV]: i18n.t('Successfully created Dev Org for task'),
      [ORG_TYPES.QA]: i18n.t('Successfully created Test Org for task'),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Successfully created Playground Org for task',
      ),
    },
    EPIC: {
      [ORG_TYPES.DEV]: i18n.t('Successfully created Dev Org for epic'),
      [ORG_TYPES.QA]: i18n.t('Successfully created Test Org for epic'),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Successfully created Playground Org for epic',
      ),
    },
    PROJECT: {
      [ORG_TYPES.DEV]: i18n.t('Successfully created Dev Org for project'),
      [ORG_TYPES.QA]: i18n.t('Successfully created Test Org for project'),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Successfully created Playground Org for project',
      ),
    },
  },
  ERROR: {
    [ORG_TYPES.DEV]: i18n.t(
      'Uh oh. There was an error creating your new Dev Org.',
    ),
    [ORG_TYPES.QA]: i18n.t(
      'Uh oh. There was an error creating your new Test Org.',
    ),
    [ORG_TYPES.PLAYGROUND]: i18n.t(
      'Uh oh. There was an error creating your new Playground Org.',
    ),
    TASK: {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error creating your new Dev Org for task',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error creating your new Test Org for task',
      ),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Uh oh. There was an error creating your new Playground Org for task',
      ),
    },
    EPIC: {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error creating your new Dev Org for epic',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error creating your new Test Org for epic',
      ),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Uh oh. There was an error creating your new Playground Org for epic',
      ),
    },
    PROJECT: {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error creating your new Dev Org for project',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error creating your new Test Org for project',
      ),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Uh oh. There was an error creating your new Playground Org for project',
      ),
    },
  },
  UPDATE_ERROR: {
    DEFAULT: i18n.t(
      'Uh oh. There was an error checking for changes on your scratch org.',
    ),
    TASK: i18n.t(
      'Uh oh. There was an error checking for changes on your scratch org for task',
    ),
    EPIC: i18n.t(
      'Uh oh. There was an error checking for changes on your scratch org for epic',
    ),
    PROJECT: i18n.t(
      'Uh oh. There was an error checking for changes on your scratch org for project',
    ),
  },
  DELETED: {
    [ORG_TYPES.DEV]: i18n.t('Successfully deleted Dev Org.'),
    [ORG_TYPES.QA]: i18n.t('Successfully deleted Test Org.'),
    [ORG_TYPES.PLAYGROUND]: i18n.t('Successfully deleted Playground Org.'),
    TASK: {
      [ORG_TYPES.DEV]: i18n.t('Successfully deleted Dev Org for task'),
      [ORG_TYPES.QA]: i18n.t('Successfully deleted Test Org for task'),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Successfully deleted Playground Org for task',
      ),
    },
    EPIC: {
      [ORG_TYPES.DEV]: i18n.t('Successfully deleted Dev Org for epic'),
      [ORG_TYPES.QA]: i18n.t('Successfully deleted Test Org for epic'),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Successfully deleted Playground Org for epic',
      ),
    },
    PROJECT: {
      [ORG_TYPES.DEV]: i18n.t('Successfully deleted Dev Org for project'),
      [ORG_TYPES.QA]: i18n.t('Successfully deleted Test Org for project'),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Successfully deleted Playground Org for project',
      ),
    },
  },
  DELETE_ERROR: {
    [ORG_TYPES.DEV]: i18n.t('Uh oh. There was an error deleting your Dev Org.'),
    [ORG_TYPES.QA]: i18n.t('Uh oh. There was an error deleting your Test Org.'),
    [ORG_TYPES.PLAYGROUND]: i18n.t(
      'Uh oh. There was an error deleting your Playground Org.',
    ),
    TASK: {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error deleting your Dev Org for task',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error deleting your Test Org for task',
      ),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Uh oh. There was an error deleting your Playground Org for task',
      ),
    },
    EPIC: {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error deleting your Dev Org for epic',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error deleting your Test Org for epic',
      ),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Uh oh. There was an error deleting your Playground Org for epic',
      ),
    },
    PROJECT: {
      [ORG_TYPES.DEV]: i18n.t(
        'Uh oh. There was an error deleting your Dev Org for project',
      ),
      [ORG_TYPES.QA]: i18n.t(
        'Uh oh. There was an error deleting your Test Org for project',
      ),
      [ORG_TYPES.PLAYGROUND]: i18n.t(
        'Uh oh. There was an error deleting your Playground Org for project',
      ),
    },
  },
  COMMITTED: {
    DEFAULT: i18n.t('Successfully retrieved changes from your scratch org.'),
    TASK: i18n.t(
      'Successfully retrieved changes from your scratch org on task',
    ),
    EPIC: i18n.t(
      'Successfully retrieved changes from your scratch org on epic',
    ),
    PROJECT: i18n.t(
      'Successfully retrieved changes from your scratch org on project',
    ),
  },
  COMMIT_ERROR: {
    DEFAULT: i18n.t(
      'Uh oh. There was an error retrieving changes from your scratch org.',
    ),
    TASK: i18n.t(
      'Uh oh. There was an error retrieving changes from your scratch org on task',
    ),
    EPIC: i18n.t(
      'Uh oh. There was an error retrieving changes from your scratch org on epic',
    ),
    PROJECT: i18n.t(
      'Uh oh. There was an error retrieving changes from your scratch org on project',
    ),
  },
  REFRESHED: {
    DEFAULT: i18n.t('Successfully refreshed your scratch org.'),
    TASK: i18n.t('Successfully refreshed your scratch org on task'),
    EPIC: i18n.t('Successfully refreshed your scratch org on epic'),
    PROJECT: i18n.t('Successfully refreshed your scratch org on project'),
  },
  REFRESH_ERROR: {
    DEFAULT: i18n.t('Uh oh. There was an error refreshing your scratch org.'),
    TASK: i18n.t(
      'Uh oh. There was an error refreshing your scratch org on task',
    ),
    EPIC: i18n.t(
      'Uh oh. There was an error refreshing your scratch org on epic',
    ),
    PROJECT: i18n.t(
      'Uh oh. There was an error refreshing your scratch org on project',
    ),
  },
  REASSIGN_ERROR: {
    DEFAULT: i18n.t('Uh oh. There was an error reassigning this scratch org.'),
    TASK: i18n.t(
      'Uh oh. There was an error reassigning the scratch org on task',
    ),
    EPIC: i18n.t(
      'Uh oh. There was an error reassigning the scratch org on epic',
    ),
    PROJECT: i18n.t(
      'Uh oh. There was an error reassigning the scratch org on project',
    ),
  },
});
