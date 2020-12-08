import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/store';
import { fetchObjects } from '@/store/actions';
import { selectEpicsByRepository } from '@/store/epics/selectors';
import { Repository } from '@/store/repositories/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

export default (
  repository: Repository | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectEpicsWithProps = useCallback(selectEpicsByRepository, []);
  const epics = useSelector((state: AppState) =>
    selectEpicsWithProps(state, routeProps),
  );

  useEffect(() => {
    if (repository && !epics?.fetched) {
      // Fetch epics from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.EPIC,
          filters: { repository: repository.id },
          reset: true,
        }),
      );
    }
  }, [dispatch, repository, epics?.fetched]);

  return { epics };
};
