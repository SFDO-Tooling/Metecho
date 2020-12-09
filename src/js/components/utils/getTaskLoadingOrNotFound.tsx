import React, { ReactElement } from 'react';

import EpicNotFound from '@/components/epics/epic404';
import ProjectNotFound from '@/components/projects/project404';
import TaskNotFound from '@/components/tasks/task404';
import { SpinnerWrapper } from '@/components/utils';
import { Epic } from '@/store/epics/reducer';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';

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
