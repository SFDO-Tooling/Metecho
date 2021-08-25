import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { selectTasksByProject } from '@/js/store/tasks/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default (
  {
    projectId,
    tasksTabViewed,
  }: {
    projectId?: string;
    tasksTabViewed: boolean;
  },
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectTasksWithProps = useCallback(selectTasksByProject, []);
  const tasks = useSelector((state: AppState) =>
    selectTasksWithProps(state, routeProps),
  );

  useEffect(() => {
    if (projectId && !tasks && tasksTabViewed) {
      // Fetch tasks from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.TASK,
          filters: { project: projectId },
        }),
      );
    }
  }, [dispatch, projectId, tasks, tasksTabViewed]);

  return { tasks };
};
