export type ObjectTypes = 'repository' | 'project' | 'task' | 'scratch_org';

export const OBJECT_TYPES = {
  REPOSITORY: 'repository' as 'repository',
  PROJECT: 'project' as 'project',
  TASK: 'task' as 'task',
  ORG: 'scratch_org' as 'scratch_org',
};

export const GITHUB_REPO_PREFIX = 'https://www.github.com';

export type OrgTypes = 'Dev' | 'QA';

export const ORG_TYPES = {
  DEV: 'Dev' as 'Dev',
  QA: 'QA' as 'QA',
};
