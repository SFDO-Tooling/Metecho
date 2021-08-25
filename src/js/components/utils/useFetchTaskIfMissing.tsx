import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObject, ObjectFilters } from '@/js/store/actions';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import { selectTask, selectTaskSlug } from '@/js/store/tasks/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default (
  opts: {
    project: Project | null | undefined;
    epic: Epic | null | undefined;
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
  const { project, epic } = opts;
  const filterByEpic = Object.prototype.hasOwnProperty.call(opts, 'epic');

  useEffect(() => {
    if (project && (epic || !filterByEpic) && taskSlug && task === undefined) {
      const filters: ObjectFilters = { project: project.id, slug: taskSlug };
      if (epic) {
        filters.epic = epic.id;
      }
      // Fetch task from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.TASK,
          filters,
        }),
      );
    }
  }, [dispatch, project, epic, task, filterByEpic, taskSlug]);

  return { task, taskSlug };
};
