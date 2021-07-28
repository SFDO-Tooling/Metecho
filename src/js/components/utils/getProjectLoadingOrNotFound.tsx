import React, { ReactElement } from 'react';

import ProjectNotFound from '_js/components/projects/project404';
import { SpinnerWrapper } from '_js/components/utils';
import { Project } from '_js/store/projects/reducer';

export default ({
  project,
  projectSlug,
}: {
  project?: Project | null;
  projectSlug?: string;
}): ReactElement | false => {
  if (!project) {
    if (!projectSlug || project === null) {
      return <ProjectNotFound />;
    }
    // Fetching project from API
    return <SpinnerWrapper />;
  }
  return false;
};
