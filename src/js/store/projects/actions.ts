import { Project } from '@/store/projects/reducer';

interface ProjectUpdated {
  type: 'PROJECT_UPDATE';
  payload: Project;
}

export type ProjectAction = ProjectUpdated;

export const updateProject = (payload: Project): ProjectUpdated => ({
  type: 'PROJECT_UPDATE',
  payload,
});
