import React, { ReactElement } from 'react';

import EpicNotFound from '@/components/epics/epic404';
import ProjectNotFound from '@/components/projects/project404';
import { SpinnerWrapper } from '@/components/utils';
import { Epic } from '@/store/epics/reducer';
import { Project } from '@/store/projects/reducer';

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
