import React, { ReactElement } from 'react';

import ProjectNotFound from '@/components/projects/project404';
import RepositoryNotFound from '@/components/repositories/repository404';
import { Project } from '@/store/projects/reducer';
import { Repository } from '@/store/repositories/reducer';

import SpinnerWrapper from './spinnerWrapper';

export default ({
  repository,
  project,
  projectSlug,
}: {
  repository?: Repository | null;
  project?: Project | null;
  projectSlug?: string;
}): ReactElement | false => {
  if (!project) {
    /* istanbul ignore if */
    if (!repository) {
      return <RepositoryNotFound />;
    }
    if (!projectSlug || project === null) {
      return <ProjectNotFound repository={repository} />;
    }
    // Fetching project from API
    return <SpinnerWrapper />;
  }
  return false;
};
