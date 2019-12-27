import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/store';
import { fetchObject } from '@/store/actions';
import {
  selectRepository,
  selectRepositorySlug,
} from '@/store/repositories/selectors';
import { OBJECT_TYPES } from '@/utils/constants';

export default (routeProps: RouteComponentProps) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectRepositoryWithProps = useCallback(selectRepository, []);
  const selectRepositorySlugWithProps = useCallback(selectRepositorySlug, []);
  const repository = useSelector((state: AppState) =>
    selectRepositoryWithProps(state, routeProps),
  );
  const repositorySlug = useSelector((state: AppState) =>
    selectRepositorySlugWithProps(state, routeProps),
  );

  useEffect(() => {
    if (repositorySlug && repository === undefined) {
      // Fetch repository from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.REPOSITORY,
          filters: { slug: repositorySlug },
        }),
      );
    }
  }, [dispatch, repository, repositorySlug]);

  return { repository, repositorySlug };
};
