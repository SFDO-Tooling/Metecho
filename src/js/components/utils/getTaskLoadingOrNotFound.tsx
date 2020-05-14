import React, { ReactElement } from 'react';

import ProjectNotFound from '@/components/projects/project404';
import RepositoryNotFound from '@/components/repositories/repository404';
import TaskNotFound from '@/components/tasks/task404';
import { SpinnerWrapper } from '@/components/utils';
import { Project } from '@/store/projects/reducer';
import { Repository } from '@/store/repositories/reducer';
import { Task } from '@/store/tasks/reducer';

export default ({
  repository,
  project,
  task,
  taskSlug,
}: {
  repository?: Repository | null;
  project?: Project | null;
  task?: Task | null;
  taskSlug?: string;
}): ReactElement | false => {
  if (!task) {
    /* istanbul ignore if */
    if (!repository) {
      return <RepositoryNotFound />;
    }
    /* istanbul ignore if */
    if (!project) {
      return <ProjectNotFound repository={repository} />;
    }
    if (!taskSlug || task === null) {
      return <TaskNotFound repository={repository} project={project} />;
    }
    // Fetching task from API
    return <SpinnerWrapper />;
  }
  return false;
};
