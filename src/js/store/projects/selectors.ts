import { createSelector } from 'reselect';

import { AppState, RouteProps } from '@/js/store';

export const selectProjectsState = (appState: AppState) => appState.projects;

export const selectProjects = createSelector(
  selectProjectsState,
  (projects) => projects.projects,
);

export const selectProjectsRefreshing = createSelector(
  selectProjectsState,
  (projects) => projects.refreshing,
);

export const selectNextUrl = createSelector(
  selectProjectsState,
  (projects) => projects.next,
);

export const selectProjectSlug = (
  appState: AppState,
  { match: { params } }: RouteProps,
) => params.projectSlug;

export const selectProjectNotFound = createSelector(
  [selectProjectsState, selectProjectSlug],
  (projects, projectSlug) =>
    Boolean(projectSlug && projects.notFound.includes(projectSlug)),
);

export const selectProject = createSelector(
  [selectProjects, selectProjectSlug, selectProjectNotFound],
  (projects, projectSlug, notFound) => {
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

export const selectProjectById = (appState: AppState, id?: string | null) =>
  Object.values(appState.projects.projects)
    .flat()
    .find((p) => p.id === id);

export const selectProjectCollaborator = (
  appState: AppState,
  projectId?: string,
  userId?: string | null,
) => {
  const project = selectProjectById(appState, projectId);
  return project?.github_users.find((user) => user.id === userId) || null;
};
