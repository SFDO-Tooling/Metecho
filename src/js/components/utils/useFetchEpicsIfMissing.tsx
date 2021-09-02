import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { selectEpicsByProject } from '@/js/store/epics/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default (
  { projectId }: { projectId?: string },
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectEpicsWithProps = useCallback(selectEpicsByProject, []);
  const epics = useSelector((state: AppState) =>
    selectEpicsWithProps(state, routeProps),
  );

  useEffect(() => {
    if (projectId && !epics?.fetched) {
      // Fetch epics from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.EPIC,
          filters: { project: projectId },
          reset: true,
        }),
      );
    }
  }, [dispatch, projectId, epics?.fetched]);

  return { epics };
};
