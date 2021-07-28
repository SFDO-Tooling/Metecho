import React, { ReactElement } from 'react';

import EpicNotFound from '@/js/components/epics/epic404';
import ProjectNotFound from '@/js/components/projects/project404';
import TaskNotFound from '@/js/components/tasks/task404';
import { SpinnerWrapper } from '@/js/components/utils';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import { Task } from '@/js/store/tasks/reducer';

export default ({
  project,
  epic,
  task,
  taskSlug,
}: {
  project?: Project | null;
  epic?: Epic | null;
  task?: Task | null;
  taskSlug?: string;
}): ReactElement | false => {
  if (!task) {
    /* istanbul ignore if */
    if (!project) {
      return <ProjectNotFound />;
    }
    /* istanbul ignore if */
    if (!epic) {
      return <EpicNotFound project={project} />;
    }
    if (!taskSlug || task === null) {
      return <TaskNotFound project={project} epic={epic} />;
    }
    // Fetching task from API
    return <SpinnerWrapper />;
  }
  return false;
};
