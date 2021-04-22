import { match } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '~js/store';
import { Project, ProjectsState } from '~js/store/projects/reducer';

import { GitHubUser } from '../user/reducer';

export const selectProjectsState = (appState: AppState): ProjectsState =>
  appState.projects;

export const selectProjects = createSelector(
  selectProjectsState,
  (projects: ProjectsState): Project[] => projects.projects,
);

export const selectProjectsRefreshing = createSelector(
  selectProjectsState,
  (projects: ProjectsState): boolean => projects.refreshing,
);

export const selectNextUrl = createSelector(
  selectProjectsState,
  (projects: ProjectsState): string | null => projects.next,
);

export const selectProjectSlug = (
  appState: AppState,
  { match: { params } }: { match: match<{ projectSlug?: string }> },
) => params.projectSlug;

export const selectProjectNotFound = createSelector(
  [selectProjectsState, selectProjectSlug],
  (projects, projectSlug): boolean =>
    Boolean(projectSlug && projects.notFound.includes(projectSlug)),
);

export const selectProject = createSelector(
  [selectProjects, selectProjectSlug, selectProjectNotFound],
  (projects, projectSlug, notFound): Project | null | undefined => {
    if (!projectSlug) {
      return undefined;
    }
    const project = projects.find(
      (r) => r.slug === projectSlug || r.old_slugs.includes(projectSlug),
    );
    if (project) {
      return project;
    }
    return notFound ? null : undefined;
  },
);

export const selectProjectById = (
  appState: AppState,
  id?: string | null,
): Project | undefined =>
  Object.values(appState.projects.projects)
    .flat()
    .find((p) => p.id === id);

/* eslint-disable func-style */
export function selectProjectCollaborators( // Returns array
  appState: AppState,
  id?: string,
): GitHubUser[] | undefined;
export function selectProjectCollaborators( // Returns single object
  appState: AppState,
  id?: string,
  userId?: string | null,
): GitHubUser | undefined;
export function selectProjectCollaborators( // Actual implementation
  appState: AppState,
  id?: string,
  userId?: string | null,
): GitHubUser | GitHubUser[] | undefined {
  const project = selectProjectById(appState, id);
  if (userId === undefined) {
    return project?.github_users;
  }
  return project?.github_users.filter((user) => user.id === userId)[0];
}
/* estlint-enable func-style */
