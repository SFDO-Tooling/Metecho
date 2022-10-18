import {
  EPIC_STATUSES,
  ORG_TYPES,
  REVIEW_STATUSES,
  TASK_STATUSES,
} from '@/js/utils/constants';

export const api_urls = {
  account_logout: () => '/accounts/logout/',
  github_login: () => '/accounts/github/login/',
  salesforce_login: () => '/accounts/salesforce/login/',
  current_user_detail: () => '/api/user/',
  current_user_refresh: () => '/api/user/refresh/',
  current_user_refresh_orgs: () => '/api/user/refresh_orgs/',
  current_user_disconnect: () => '/api/user/disconnect/',
  current_user_agree_to_tos: () => '/api/user/agree_to_tos/',
  current_user_complete_onboarding: () => '/api/user/complete_onboarding/',
  current_user_guided_tour: () => '/api/user/guided_tour/',
  project_list: () => '/api/projects/',
  project_detail: (slug: string) => `/api/projects/${slug}/`,
  project_refresh_github_issues: (id: string) =>
    `/api/projects/${id}/refresh_github_issues`,
  project_refresh_github_users: (id: string) =>
    `/api/projects/${id}/refresh_github_users/`,
  epic_list: () => '/api/epics/',
  scratch_org_list: () => '/api/scratch-orgs/',
  scratch_org_detail: (id: string) => `/api/scratch-orgs/${id}/`,
  scratch_org_commit: (id: string) => `/api/scratch_orgs/${id}/commit/`,
  scratch_org_commit_dataset: (id: string) =>
    `/api/scratch-orgs/${id}/commit_dataset/`,
  scratch_org_commit_omnistudio: (id: string) =>
    `/api/scratch-orgs/${id}/commit_omnistudio/`,
  scratch_org_redirect: (id: string) => `/api/scratch-orgs/${id}/redirect/`,
  scratch_org_refresh: (id: string) => `/api/scratch-orgs/${id}/refresh/`,
  scratch_org_parse_datasets: (id: string) =>
    `/api/scratch-orgs/${id}/parse_datasets/`,
  task_detail: (id: string) => `/api/tasks/${id}/`,
  task_list: () => 'api/tasks/',
  task_create_pr: (id: string) => `/api/tasks/${id}/create_pr/`,
  task_review: (id: string) => `/api/tasks/${id}/review/`,
  task_can_reassign: (id: string) => `/api/tasks/${id}/can_reassign/`,
  task_assignees: (id: string) => `/api/tasks/${id}/assignees/`,
  epic_detail: (id: string) => `/api/epics/${id}/`,
  epic_create_pr: (id: string) => `/api/epics/${id}/create_pr/`,
  epic_collaborators: (id: string) => `/api/epics/${id}/collaborators/`,
  project_refresh_org_config_names: (id: string) =>
    `/api/projects/${id}/refresh_org_config_names/`,
  project_feature_branches: (id: string) =>
    `/api/projects/${id}/feature_branches/`,
  issue_list: () => '/api/issues/',
  organization_check_repo_name: (id: string) =>
    `/api/organizations/${id}/check_repo_name/`,
  organization_members: (id: string) => `/api/organizations/${id}/members/`,
  organization_check_app_installation: (id: string) =>
    `/api/organizations/${id}/check_app_installation/`,
};

export const sampleUser1 = {
  id: 'U1',
  username: 'someuser1',
  email: 'developer@web.com',
  avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
  github_id: 999999,
  valid_token_for: '00Dxxxxxxxxxxxxxxx',
  sf_username: 'developer@web.com',
  org_name: 'OddBird',
  org_type: 'Developer Edition',
  is_devhub_enabled: true,
  is_staff: false,
  currently_fetching_repos: false,
  devhub_username: '',
  uses_global_devhub: false,
  agreed_to_tos_at: '2019-02-01T19:47:49Z',
  onboarded_at: '2019-02-01T19:47:49Z',
  self_guided_tour_enabled: false,
  self_guided_tour_state: null,
  organizations: [],
  currently_fetching_orgs: false,
};

export const sampleGitHubUser1 = {
  id: 999999,
  login: 'TestGitHubUser',
  name: 'Test GitHub User',
  avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
  permissions: {
    push: true,
    pull: true,
    admin: false,
  },
};

export const sampleGitHubUser2 = {
  id: 234567,
  login: 'OtherUser',
  name: 'Other User',
  avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg',
  permissions: {
    push: true,
    pull: true,
    admin: false,
  },
};

export const sampleGitHubUser3 = {
  id: 345678,
  login: 'ThirdUser',
  avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg',
  permissions: {
    push: true,
    pull: true,
    admin: false,
  },
};

export const sampleGitHubUser4 = {
  id: 123123,
  login: 'FourthUser',
  avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg',
  permissions: {
    push: true,
    pull: true,
    admin: false,
  },
};

export const sampleReadOnlyGitHubUser = {
  id: 444444,
  login: 'ReadOnly',
  avatar_url: 'https://randomuser.me/api/portraits/men/4.jpg',
  permissions: {
    push: false,
    pull: true,
    admin: false,
  },
};

export const sampleCommitAuthor = {
  name: 'Jack Brown',
  email: 'developer@web.com',
  username: 'adeveloper',
  avatar_url: 'https://randomuser.me/api/portraits/men/83.jpg',
  permissions: {
    push: true,
    pull: true,
    admin: false,
  },
};

export const sampleCommit1 = {
  id: '8471ad6',
  timestamp: '2019-02-01T19:47:49Z',
  message: 'fix homepage image',
  author: sampleCommitAuthor,
  url: '/',
};

export const sampleCommit2 = {
  id: '8761ad7',
  timestamp: '2020-02-01T19:47:49Z',
  message: 'add color filter to header',
  author: sampleCommitAuthor,
  url: '/',
};

export const sampleEpic1 = {
  id: 'e1',
  project: 'p1',
  name: 'My Epic',
  slug: 'my-epic',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  description: 'Epic Description',
  description_rendered: '<p>Epic Description</p>',
  branch_name: 'feature/my-epic',
  branch_url: 'https://github.com/test/test-repo/tree/feature/my-epic',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/main...feature/my-epic',
  pr_url: null,
  pr_is_open: false,
  pr_is_merged: false,
  has_unmerged_commits: false,
  currently_creating_branch: false,
  currently_creating_pr: false,
  github_users: [sampleGitHubUser2.id],
  status: EPIC_STATUSES.PLANNED,
  latest_sha: 'abc123',
  task_count: 6,
  issue: null,
};

export const sampleEpic2 = {
  id: 'e2',
  project: 'p1',
  name: 'Mid-Year Project Saturn',
  slug: 'midyear-project-saturn',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  description:
    'Stabilize existing structures and provide clarity to team members.',
  description_rendered:
    '<p>Stabilize existing structures and provide clarity to team members.</p>',
  branch_name: 'feature/midyear-project-saturn',
  branch_url:
    'https://github.com/test/test-repo/tree/feature/midyear-project-saturn',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/main...feature/midyear-project-saturn',
  pr_url: 'https://github.com/test/test-repo/pull/1234',
  pr_is_open: true,
  pr_is_merged: false,
  has_unmerged_commits: true,
  currently_creating_branch: false,
  currently_creating_pr: false,
  github_users: [
    sampleGitHubUser1.id,
    sampleGitHubUser2.id,
    sampleGitHubUser3.id,
  ],
  status: EPIC_STATUSES.IN_PROGRESS,
  latest_sha: 'abc123',
  task_count: 1,
  issue: null,
};

export const sampleEpic3 = {
  id: 'e3',
  project: 'p1',
  name: 'Regular Database Backups',
  slug: 'database-backups',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  description: '',
  description_rendered: '',
  branch_name: '',
  branch_url: null,
  branch_diff_url: null,
  pr_url: '',
  pr_is_open: false,
  pr_is_merged: false,
  has_unmerged_commits: false,
  currently_creating_branch: false,
  currently_creating_pr: false,
  github_users: [],
  status: EPIC_STATUSES.PLANNED,
  latest_sha: 'abc123',
  task_count: 0,
  issue: null,
};

export const sampleEpic4 = {
  id: 'e4',
  project: 'p1',
  name: 'Data Controls',
  slug: 'data-controls',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  description: 'Links the controller field to the static items',
  description_rendered: '<p>Links the controller field to the static items</p>',
  branch_name: 'feature/data-controls',
  branch_url: 'https://github.com/test/test-repo/tree/feature/data-controls',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/main...feature/data-controls',
  pr_url: null,
  pr_is_open: false,
  pr_is_merged: false,
  has_unmerged_commits: false,
  currently_creating_branch: false,
  currently_creating_pr: false,
  github_users: [],
  status: EPIC_STATUSES.MERGED,
  latest_sha: 'abc123',
  task_count: 5,
  issue: null,
};

export const sampleEpic5 = {
  id: 'e5',
  project: 'p1',
  name: 'Widgets',
  slug: 'widgets',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  description: 'These are the widgets.',
  description_rendered: '<p>These are the widgets.</p>',
  branch_name: 'feature/widgets',
  branch_url: 'https://github.com/test/test-repo/tree/feature/widgets',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/main...feature/widgets',
  pr_url: 'https://github.com/test/test-repo/pull/5678',
  pr_is_open: true,
  pr_is_merged: false,
  has_unmerged_commits: true,
  currently_creating_branch: false,
  currently_creating_pr: false,
  github_users: [sampleGitHubUser1.id, sampleGitHubUser2.id],
  status: EPIC_STATUSES.REVIEW,
  latest_sha: 'abc123',
  task_count: 3,
  issue: null,
};

export const sampleTask1 = {
  id: 't1',
  name: 'Data Mapping',
  slug: 'data-mapping',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  epic: {
    id: 'e1',
    name: 'My Epic',
    slug: 'my-epic',
    github_users: [sampleGitHubUser2.id],
  },
  project: null,
  root_project: 'p1',
  root_project_slug: 'p1',
  description: 'This is a description',
  description_rendered: '<p>This is <em>safely</em> rendered Markdown.</p>',
  has_unmerged_commits: true,
  currently_creating_branch: false,
  currently_creating_pr: false,
  branch_name: 'feature/my-epic__data-mapping',
  branch_url:
    'https://github.com/test/test-repo/tree/feature/my-epic__data-mapping',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/feature/my-epic...feature/my-epic__data-mapping',
  pr_url: 'https://github.com/test/test-repo/pull/1357',
  pr_is_open: true,
  commits: [sampleCommit1],
  origin_sha: '723b342',
  assigned_dev: sampleGitHubUser1,
  assigned_qa: null,
  status: TASK_STATUSES.IN_PROGRESS,
  currently_submitting_review: false,
  review_submitted_at: '2019-03-01T19:47:49Z',
  review_valid: true,
  review_status: REVIEW_STATUSES.APPROVED,
  review_sha: '617a512',
  org_config_name: 'dev',
  issue: null,
};

export const sampleTask2 = {
  id: 't2',
  name: 'Control Toggles for Accessible Actions',
  slug: 'control-toggles',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  epic: {
    id: 'e1',
    name: 'My Epic',
    slug: 'my-epic',
    github_users: [sampleGitHubUser2.id],
  },
  project: null,
  root_project: 'p1',
  root_project_slug: 'p1',
  description:
    'Add panel for controls toggles allowing for accessible interaction',
  description_rendered:
    '<p>Add panel for controls toggles allowing for accessible interaction.</p>',
  has_unmerged_commits: false,
  currently_creating_branch: false,
  currently_creating_pr: false,
  branch_name: '',
  branch_url: null,
  branch_diff_url: null,
  pr_url: null,
  pr_is_open: false,
  commits: [],
  origin_sha: '',
  assigned_dev: null,
  assigned_qa: null,
  status: TASK_STATUSES.PLANNED,
  currently_submitting_review: false,
  review_submitted_at: null,
  review_valid: false,
  review_status: '' as const,
  review_sha: '',
  org_config_name: 'dev',
  issue: null,
};

export const sampleTask3 = {
  id: 't3',
  name: 'Dark Mode and High Contrast Options',
  slug: 'dark-mode',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  epic: {
    id: 'e1',
    name: 'My Epic',
    slug: 'my-epic',
    github_users: [sampleGitHubUser2.id],
  },
  project: null,
  root_project: 'p1',
  root_project_slug: 'p1',
  description: 'Include options set by operating system preferences',
  description_rendered:
    '<p>Include options set by **operating system preferences**</p>',
  has_unmerged_commits: false,
  currently_creating_branch: false,
  currently_creating_pr: false,
  branch_name: 'feature/my-epic__dark-mode',
  branch_url:
    'https://github.com/test/test-repo/tree/feature/my-epic__dark-mode',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/feature/my-epic...feature/my-epic__dark-mode',
  pr_url: 'https://github.com/test/test-repo/pull/1357',
  pr_is_open: false,
  commits: [sampleCommit1],
  origin_sha: '723b342',
  assigned_dev: sampleGitHubUser3,
  assigned_qa: sampleGitHubUser1,
  status: TASK_STATUSES.COMPLETED,
  currently_submitting_review: false,
  review_submitted_at: '2019-03-01T19:47:49Z',
  review_valid: true,
  review_status: REVIEW_STATUSES.APPROVED,
  review_sha: '617a512',
  org_config_name: 'dev',
  issue: null,
};

export const sampleTask4 = {
  id: 't4',
  name: 'Universal Language Selectors',
  slug: 'universal-language',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  epic: {
    id: 'e1',
    name: 'My Epic',
    slug: 'my-epic',
    github_users: [sampleGitHubUser2.id],
  },
  project: null,
  root_project: 'p1',
  root_project_slug: 'p1',
  description: 'Internationalization and Localization built in options',
  description_rendered:
    '<p>Internationalization and Localization built in options</p>',
  has_unmerged_commits: false,
  currently_creating_branch: false,
  currently_creating_pr: false,
  branch_name: 'feature/my-epic__universal-language',
  branch_url:
    'https://github.com/test/test-repo/tree/feature/my-epic__universal-language',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/feature/my-epic...feature/my-epic__universal-language',
  pr_url: 'https://github.com/test/test-repo/pull/9999',
  pr_is_open: true,
  commits: [sampleCommit1],
  origin_sha: '723b342',
  assigned_dev: sampleGitHubUser2,
  assigned_qa: sampleGitHubUser3,
  status: TASK_STATUSES.IN_PROGRESS,
  currently_submitting_review: false,
  review_submitted_at: '2019-03-01T19:47:49Z',
  review_valid: true,
  review_status: REVIEW_STATUSES.CHANGES_REQUESTED,
  review_sha: '617a512',
  org_config_name: 'dev',
  issue: null,
};

export const sampleTask5 = {
  id: 't5',
  name: 'Additional User Role Permissions',
  slug: 'user-roles',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  epic: {
    id: 'e1',
    name: 'My Epic',
    slug: 'my-epic',
    github_users: [sampleGitHubUser2.id],
  },
  project: null,
  root_project: 'p1',
  root_project_slug: 'p1',
  description: '',
  description_rendered: '',
  has_unmerged_commits: false,
  currently_creating_branch: false,
  currently_creating_pr: false,
  branch_name: 'feature/my-epic__user-roles',
  branch_url:
    'https://github.com/test/test-repo/tree/feature/my-epic__user-roles',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/feature/my-epic...feature/my-epic__user-roles',
  pr_url: '',
  pr_is_open: false,
  commits: [sampleCommit2],
  origin_sha: '723b342',
  assigned_dev: sampleGitHubUser1,
  assigned_qa: null,
  status: TASK_STATUSES.IN_PROGRESS,
  currently_submitting_review: false,
  review_submitted_at: null,
  review_valid: false,
  review_status: '' as const,
  review_sha: '',
  org_config_name: 'dev',
  issue: null,
};

export const sampleTask6 = {
  id: 't6',
  name: 'Add the Widgets',
  slug: 'add-widgets',
  old_slugs: [],
  created_at: '2019-10-24T20:03:52.159440Z',
  epic: {
    id: 'e1',
    name: 'My Epic',
    slug: 'my-epic',
    github_users: [sampleGitHubUser2.id],
  },
  project: null,
  root_project: 'p1',
  root_project_slug: 'p1',
  description: '',
  description_rendered: '',
  has_unmerged_commits: false,
  currently_creating_branch: false,
  currently_creating_pr: false,
  branch_name: 'feature/my-epic__add-widgets',
  branch_url:
    'https://github.com/test/test-repo/tree/feature/my-epic__add-widgets',
  branch_diff_url:
    'https://github.com/test/test-repo/compare/feature/my-epic...feature/my-epic__add-widgets',
  pr_url: 'https://github.com/test/test-repo/pull/8888',
  pr_is_open: true,
  commits: [sampleCommit2],
  origin_sha: '723b342',
  assigned_dev: sampleGitHubUser2,
  assigned_qa: sampleGitHubUser3,
  status: TASK_STATUSES.IN_PROGRESS,
  currently_submitting_review: false,
  review_submitted_at: null,
  review_valid: false,
  review_status: '' as const,
  review_sha: '',
  org_config_name: 'dev',
  issue: null,
};

export const sampleProject1 = {
  id: 'p1',
  name: 'Sample Project',
  slug: 'my-project',
  old_slugs: [],
  repo_url: 'https://github.com/test/test-repo',
  repo_owner: 'test',
  repo_name: 'test-repo',
  description: 'This is *safely* rendered Markdown.',
  description_rendered: '<p>This is <em>safely</em> rendered Markdown.</p>',
  is_managed: false,
  branch_prefix: '',
  github_users: [sampleGitHubUser1, sampleGitHubUser2, sampleGitHubUser3],
  repo_image_url:
    'https://repository-images.githubusercontent.com/123456/123-456',
  currently_fetching_org_config_names: false,
  currently_fetching_github_users: false,
  currently_fetching_issues: false,
  org_config_names: [],
  latest_sha: 'abc123',
  has_push_permission: true,
  github_issue_count: 5,
  has_truncated_issues: false,
};

export const sampleEpicSteps = [
  {
    label: 'Create a Task',
    active: true,
    complete: false,
  },
  {
    label: 'Assign a Developer to a Task',
    active: false,
    complete: false,
  },
  {
    label: 'Submit this Epic for review on GitHub',
    active: false,
    complete: false,
  },
  {
    label: 'Merge pull request on GitHub',
    active: false,
    complete: false,
    hidden: false,
  },
];

export const sampleEpicStepsWithAction = [
  {
    label: 'Create a Task',
    active: false,
    complete: true,
  },
  {
    label: 'Assign a Developer to a Task',
    active: false,
    complete: true,
  },
  {
    label: 'Submit this Epic for review on GitHub',
    active: true,
    complete: false,
    action: 'submit',
  },
  {
    label: 'Merge pull request on GitHub',
    active: false,
    complete: false,
    link: '#',
  },
];

export const sampleEpicStepsWithLink = [
  {
    label: 'Create a Task',
    active: false,
    complete: true,
  },
  {
    label: 'Assign a Developer to a Task',
    active: false,
    complete: true,
  },
  {
    label: 'Submit this Epic for review on GitHub',
    active: false,
    complete: true,
    action: 'submit',
  },
  {
    label: 'Merge pull request on GitHub',
    active: true,
    complete: false,
    link: '#',
  },
];

export const sampleTaskSteps = [
  {
    label: 'Assign a Developer',
    active: true,
    complete: false,
    action: 'assign-dev',
  },
  {
    label: 'Create a Scratch Org for development',
    active: false,
    complete: false,
  },
  {
    label: 'Make changes in Dev Org',
    active: false,
    complete: false,
  },
  {
    label: 'Retrieve changes from Dev Org',
    active: false,
    complete: false,
    action: 'retrieve-changes',
  },
  {
    label: 'Submit changes for testing',
    active: false,
    complete: false,
    action: 'submit-changes',
  },
  {
    label: 'Assign a Tester',
    active: false,
    complete: false,
    action: 'assign-qa',
  },
  {
    label: 'Create a Scratch Org for testing',
    active: false,
    complete: false,
  },
  {
    label: 'Refresh Test Org',
    active: false,
    complete: false,
    hidden: true,
  },
  {
    label: 'Test changes in Test Org',
    active: false,
    complete: false,
  },
  {
    label: 'Submit a review',
    active: false,
    complete: false,
  },
  {
    label: 'Merge pull request on GitHub',
    active: false,
    complete: false,
  },
];

export const sampleTaskStepsWithAssignee = [
  {
    label: 'Assign a Developer',
    active: false,
    complete: true,
    action: 'assign-dev',
  },
  {
    label: 'Create a Scratch Org for development',
    active: false,
    complete: true,
  },
  {
    label: 'Make changes in Dev Org',
    active: false,
    complete: true,
  },
  {
    label: 'Retrieve changes from Dev Org',
    active: true,
    complete: false,
    assignee: sampleGitHubUser2,
    action: 'retrieve-changes',
  },
  {
    label: 'Submit changes for testing',
    active: false,
    complete: false,
    action: 'submit-changes',
  },
  {
    label: 'Assign a Tester',
    active: false,
    complete: false,
    action: 'assign-qa',
  },
  {
    label: 'Create a Scratch Org for testing',
    active: false,
    complete: false,
  },
  {
    label: 'Refresh Test Org',
    active: false,
    complete: false,
    hidden: true,
  },
  {
    label: 'Test changes in Test Org',
    active: false,
    complete: false,
  },
  {
    label: 'Submit a review',
    active: false,
    complete: false,
  },
  {
    label: 'Merge pull request on GitHub',
    active: false,
    complete: false,
  },
];

export const sampleDevOrg = {
  id: 'org-id',
  task: 'task-id',
  epic: null,
  project: null,
  org_type: ORG_TYPES.DEV,
  owner: 'user-id',
  owner_gh_username: 'user-name',
  owner_gh_id: 123456,
  description: '',
  description_rendered: '',
  org_config_name: 'dev',
  last_modified_at: '2019-10-24T20:03:52.159440Z',
  expires_at: '2019-11-16T12:58:53.721Z',
  latest_commit: '617a512-longlong',
  latest_commit_url: '/test/commit/url/',
  latest_commit_at: '2019-08-16T12:58:53.721Z',
  url: '/test/org/url/',
  unsaved_changes: { Foo: ['Bar'] },
  total_unsaved_changes: 1,
  has_unsaved_changes: true,
  ignored_changes: {},
  total_ignored_changes: 0,
  has_ignored_changes: false,
  is_created: true,
  currently_refreshing_changes: false,
  currently_retrieving_metadata: false,
  currently_retrieving_dataset: false,
  currently_refreshing_org: false,
  currently_reassigning_user: false,
  delete_queued_at: null,
  has_been_visited: true,
  last_checked_unsaved_changes_at: null,
  valid_target_directories: {},
  currently_parsing_datasets: false,
};

export const sampleScratchOrg = {
  id: 'org-id',
  task: null,
  epic: null,
  project: 'project-id',
  org_type: ORG_TYPES.PLAYGROUND,
  owner: 'user-id',
  owner_gh_username: 'user-name',
  owner_gh_id: 123456,
  description: '',
  description_rendered: '',
  org_config_name: 'dev',
  last_modified_at: '2019-10-24T20:03:52.159440Z',
  expires_at: '2019-11-16T12:58:53.721Z',
  latest_commit: '617a512-longlong',
  latest_commit_url: '/test/commit/url/',
  latest_commit_at: '2019-08-16T12:58:53.721Z',
  url: '/test/org/url/',
  unsaved_changes: { Foo: ['Bar'] },
  total_unsaved_changes: 1,
  has_unsaved_changes: true,
  ignored_changes: {},
  total_ignored_changes: 0,
  has_ignored_changes: false,
  is_created: true,
  currently_refreshing_changes: false,
  currently_retrieving_metadata: false,
  currently_retrieving_dataset: false,
  currently_refreshing_org: false,
  currently_reassigning_user: false,
  delete_queued_at: null,
  has_been_visited: true,
  last_checked_unsaved_changes_at: null,
  valid_target_directories: {},
  currently_parsing_datasets: false,
};

export const sampleIssue1 = {
  id: 'test123',
  number: 87,
  title: 'this is an issue',
  created_at: '2019-10-24T20:03:52.159440Z',
  html_url: 'https://example.com',
  project: sampleProject1.id,
  epic: null,
  task: null,
};

export const sampleIssue2 = {
  id: 'test456',
  number: 93,
  title: 'this is another issue',
  created_at: '2019-10-24T20:03:52.159440Z',
  html_url: 'https://example.com',
  project: sampleProject1.id,
  epic: {
    id: sampleEpic1.id,
    name: sampleEpic1.name,
    status: sampleEpic1.status,
    slug: sampleEpic1.slug,
  },
  task: null,
};

export const sampleIssue3 = {
  id: 'test789',
  number: 3,
  title: 'this is a third issue',
  created_at: '2019-10-24T20:03:52.159440Z',
  html_url: 'https://example.com',
  project: sampleProject1.id,
  epic: null,
  task: {
    id: sampleTask1.id,
    name: sampleTask1.name,
    status: sampleTask1.status,
    review_status: sampleTask1.review_status,
    review_valid: sampleTask1.review_valid,
    pr_is_open: sampleTask1.pr_is_open,
    slug: sampleTask1.slug,
    epic_slug: sampleTask1.epic.slug,
  },
};

export const sampleIssue4 = {
  id: 'test4',
  number: 4,
  title: 'this is a fourth issue',
  created_at: '2019-10-24T20:03:52.159440Z',
  html_url: 'https://example.com',
  project: sampleProject1.id,
  epic: null,
  task: {
    id: sampleTask1.id,
    name: sampleTask1.name,
    status: sampleTask1.status,
    review_status: sampleTask1.review_status,
    review_valid: sampleTask1.review_valid,
    pr_is_open: sampleTask1.pr_is_open,
    slug: sampleTask1.slug,
    epic_slug: null,
  },
};

export const sampleProjectDependency = {
  id: 'dep-1',
  name: 'A Test Dependency',
  recommended: false,
};

export const sampleProjectDependency2 = {
  id: 'dep-2',
  name: 'Another Test Dependency',
  recommended: true,
};

export const sampleGitHubOrg = {
  id: 'org-1',
  name: 'A Test Org',
  avatar_url: '',
};

export const sampleGitHubOrg2 = {
  id: 'org-2',
  name: 'Another Test Org',
  avatar_url: '',
};

export const sampleDatasetSchema = {
  Account: {
    label: 'Account',
    count: 5,
    fields: {
      FooBar: { label: 'Foo Bar' },
      BuzBaz: { label: 'Buz Baz' },
    },
  },
  ApexClass: {
    label: 'Apex Class',
    count: 1,
    fields: {
      ApiVersion: { label: 'Api Version' },
    },
  },
};

export const sampleChangeset = {
  Account: ['FooBar', 'BuzBaz'],
};

export const sampleDatasets = {
  Default: sampleChangeset,
  'Another Dataset': { Account: ['Other'], WebLink: ['OpenType'] },
};
