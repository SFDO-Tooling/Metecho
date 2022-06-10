import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { selectUserTasks } from '@/js/store/tasks/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default () => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectTasksWithProps = useCallback(selectUserTasks, []);
  const tasks = useSelector((state: AppState) => selectTasksWithProps(state));
  useEffect(() => {
    // Fetch tasks from API
    dispatch(
      fetchObjects({
        objectType: OBJECT_TYPES.TASK,
        filters: { assigned_to_me: 'true' },
      }),
    );
  }, [dispatch]);

  return { tasks };
};
