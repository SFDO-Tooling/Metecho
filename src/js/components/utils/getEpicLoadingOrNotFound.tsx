import React, { ReactElement } from 'react';

import EpicNotFound from '@/js/components/epics/epic404';
import ProjectNotFound from '@/js/components/projects/project404';
import { SpinnerWrapper } from '@/js/components/utils';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';

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
