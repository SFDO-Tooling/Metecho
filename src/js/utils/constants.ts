export type ObjectTypes = 'repository' | 'project' | 'task' | 'org';

export const OBJECT_TYPES = {
  REPOSITORY: 'repository' as 'repository',
  PROJECT: 'project' as 'project',
  TASK: 'task' as 'task',
  ORG: 'org' as 'org',
};

export const GITHUB_REPO_PREFIX = 'https://www.github.com';

export type OrgTypes = 'dev' | 'qa';

export const ORG_TYPES = {
  DEV: 'dev' as 'dev',
  QA: 'qa' as 'qa',
};
