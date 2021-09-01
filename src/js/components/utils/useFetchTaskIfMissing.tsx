import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObject } from '@/js/store/actions';
import { selectTask, selectTaskSlug } from '@/js/store/tasks/selectors';
import { NULL_FILTER_VALUE, OBJECT_TYPES } from '@/js/utils/constants';

export default (
  {
    projectId,
    epicId,
    filterByEpic,
  }: {
    projectId?: string;
    epicId?: string;
    filterByEpic?: boolean;
  },
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectTaskWithProps = useCallback(selectTask, []);
  const selectTaskSlugWithProps = useCallback(selectTaskSlug, []);
  const task = useSelector((state: AppState) =>
    selectTaskWithProps(state, routeProps),
  );
  const taskSlug = useSelector((state: AppState) =>
    selectTaskSlugWithProps(state, routeProps),
  );

  useEffect(() => {
    if (
      projectId &&
      (epicId || !filterByEpic) &&
      taskSlug &&
      task === undefined
    ) {
      // Fetch task from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.TASK,
          filters: {
            project: projectId,
            epic: epicId || NULL_FILTER_VALUE,
            slug: taskSlug,
          },
        }),
      );
    }
  }, [dispatch, projectId, epicId, task, filterByEpic, taskSlug]);

  return { task, taskSlug };
};
