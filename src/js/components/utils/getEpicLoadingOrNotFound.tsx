import EpicNotFound from '_js/components/epics/epic404';
import ProjectNotFound from '_js/components/projects/project404';
import { SpinnerWrapper } from '_js/components/utils';
import { Epic } from '_js/store/epics/reducer';
import { Project } from '_js/store/projects/reducer';
import React, { ReactElement } from 'react';

export default ({
  project,
  epic,
  epicSlug,
}: {
  project?: Project | null;
  epic?: Epic | null;
  epicSlug?: string;
}): ReactElement | false => {
  if (!epic) {
    /* istanbul ignore if */
    if (!project) {
      return <ProjectNotFound />;
    }
    if (!epicSlug || epic === null) {
      return <EpicNotFound project={project} />;
    }
    // Fetching epic from API
    return <SpinnerWrapper />;
  }
  return false;
};
