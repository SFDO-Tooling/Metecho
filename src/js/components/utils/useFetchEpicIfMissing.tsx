import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/store';
import { fetchObject } from '@/store/actions';
import { selectEpic, selectEpicSlug } from '@/store/epics/selectors';
import { Repository } from '@/store/repositories/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

export default (
  repository: Repository | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectEpicWithProps = useCallback(selectEpic, []);
  const selectEpicSlugWithProps = useCallback(selectEpicSlug, []);
  const epic = useSelector((state: AppState) =>
    selectEpicWithProps(state, routeProps),
  );
  const epicSlug = useSelector((state: AppState) =>
    selectEpicSlugWithProps(state, routeProps),
  );

  useEffect(() => {
    if (repository && epicSlug && epic === undefined) {
      // Fetch epic from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.EPIC,
          filters: { repository: repository.id, slug: epicSlug },
        }),
      );
    }
  }, [dispatch, repository, epic, epicSlug]);

  return { epic, epicSlug };
};
