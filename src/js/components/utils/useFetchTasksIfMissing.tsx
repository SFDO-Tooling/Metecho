import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObjects, ObjectFilters } from '@/js/store/actions';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import { selectTasksByEpic } from '@/js/store/tasks/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default (
  opts: {
    project: Project | null | undefined;
    epic: Epic | null | undefined;
  },
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectTasksWithProps = useCallback(selectTasksByEpic, []);
  const tasks = useSelector((state: AppState) =>
    selectTasksWithProps(state, routeProps),
  );
  const { project, epic } = opts;
  const filterByEpic = Object.prototype.hasOwnProperty.call(opts, 'epic');

  useEffect(() => {
    if (project && !tasks && (epic || !filterByEpic)) {
      const filters: ObjectFilters = { project: project.id };
      if (epic) {
        filters.epic = epic.id;
      }
      // Fetch tasks from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.TASK,
          filters,
        }),
      );
    }
  }, [dispatch, project, epic, tasks, filterByEpic]);

  return { tasks };
};
