import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/store';
import { fetchObjects } from '@/store/actions';
import { selectProjectsByRepository } from '@/store/projects/selectors';
import { Repository } from '@/store/repositories/reducer';
import { OBJECT_TYPES } from '@/utils/constants';

export default (
  repository: Repository | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectProjectsWithProps = useCallback(selectProjectsByRepository, []);
  const projects = useSelector((state: AppState) =>
    selectProjectsWithProps(state, routeProps),
  );

  useEffect(() => {
    if (repository && !projects?.fetched) {
      // Fetch projects from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { repository: repository.id },
          reset: true,
          shouldSubscribeToObject: true,
        }),
      );
    }
  }, [dispatch, repository, projects]);

  return { projects };
};
