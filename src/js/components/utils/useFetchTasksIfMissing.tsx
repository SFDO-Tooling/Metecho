import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/store';
import { fetchObjects } from '@/store/actions';
import { Epic } from '@/store/epics/reducer';
import { selectTasksByEpic } from '@/store/tasks/selectors';
import { OBJECT_TYPES } from '@/utils/constants';

export default (
  epic: Epic | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectTasksWithProps = useCallback(selectTasksByEpic, []);
  const tasks = useSelector((state: AppState) =>
    selectTasksWithProps(state, routeProps),
  );

  useEffect(() => {
    if (epic && !tasks) {
      // Fetch tasks from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.TASK,
          filters: { epic: epic.id },
        }),
      );
    }
  }, [dispatch, epic, tasks]);

  return { tasks };
};
