import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObject, ObjectFilters } from '@/js/store/actions';
import { selectTask, selectTaskSlug } from '@/js/store/tasks/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

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
      const filters: ObjectFilters = { project: projectId, slug: taskSlug };
      if (epicId) {
        filters.epic = epicId;
      }
      // Fetch task from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.TASK,
          filters,
        }),
      );
    }
  }, [dispatch, projectId, epicId, task, filterByEpic, taskSlug]);

  return { task, taskSlug };
};
