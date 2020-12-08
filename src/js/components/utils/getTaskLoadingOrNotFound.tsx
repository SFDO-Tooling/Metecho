import React, { ReactElement } from 'react';

import EpicNotFound from '@/components/epics/epic404';
import RepositoryNotFound from '@/components/repositories/repository404';
import TaskNotFound from '@/components/tasks/task404';
import { SpinnerWrapper } from '@/components/utils';
import { Epic } from '@/store/epics/reducer';
import { Repository } from '@/store/repositories/reducer';
import { Task } from '@/store/tasks/reducer';

export default ({
  repository,
  epic,
  task,
  taskSlug,
}: {
  repository?: Repository | null;
  epic?: Epic | null;
  task?: Task | null;
  taskSlug?: string;
}): ReactElement | false => {
  if (!task) {
    /* istanbul ignore if */
    if (!repository) {
      return <RepositoryNotFound />;
    }
    /* istanbul ignore if */
    if (!epic) {
      return <EpicNotFound repository={repository} />;
    }
    if (!taskSlug || task === null) {
      return <TaskNotFound repository={repository} epic={epic} />;
    }
    // Fetching task from API
    return <SpinnerWrapper />;
  }
  return false;
};
