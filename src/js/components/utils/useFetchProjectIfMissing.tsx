import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObject } from '@/js/store/actions';
import {
  selectProject,
  selectProjectSlug,
} from '@/js/store/projects/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default (routeProps: RouteComponentProps) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectProjectWithProps = useCallback(selectProject, []);
  const selectProjectSlugWithProps = useCallback(selectProjectSlug, []);
  const project = useSelector((state: AppState) =>
    selectProjectWithProps(state, routeProps),
  );
  const projectSlug = useSelector((state: AppState) =>
    selectProjectSlugWithProps(state, routeProps),
  );

  useEffect(() => {
    if (projectSlug && project === undefined) {
      // Fetch project from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { slug: projectSlug },
        }),
      );
    }
  }, [dispatch, project, projectSlug]);

  return { project, projectSlug };
};
