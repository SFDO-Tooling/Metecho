import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { selectTasksByEpic } from '@/js/store/tasks/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default (
  {
    projectId,
    epicId,
    next,
  }: {
    projectId?: string;
    epicId?: string;
    next?: {
      next: string;
      all: string;
    };
  },
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectTasksWithProps = useCallback(selectTasksByEpic, []);
  const tasks = useSelector((state: AppState) =>
    selectTasksWithProps(state, routeProps),
  );

  useEffect(() => {
    if (projectId && epicId && !tasks) {
      // Fetch tasks from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.TASK,
          // Filtering by `project` would not strictly be necessary for the API,
          // but Redux uses it to know what project this epic belongs to.
          filters: { project: projectId, epic: epicId },
        }),
      );
    }
  }, [dispatch, projectId, epicId, tasks, next]);

  return { tasks };
};
