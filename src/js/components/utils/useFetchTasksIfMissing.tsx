import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { Epic } from '@/js/store/epics/reducer';
import { selectTasksByEpic } from '@/js/store/tasks/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

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
