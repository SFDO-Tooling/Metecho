import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObject } from '@/js/store/actions';
import { selectEpic, selectEpicSlug } from '@/js/store/epics/selectors';
import { Project } from '@/js/store/projects/reducer';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default (
  project: Project | null | undefined,
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
  const epicCollaborators = (project?.github_users || []).filter((user) =>
    epic?.github_users.includes(user.id),
  );

  useEffect(() => {
    if (project && epicSlug && epic === undefined) {
      // Fetch epic from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.EPIC,
          filters: { project: project.id, slug: epicSlug },
        }),
      );
    }
  }, [dispatch, project, epic, epicSlug]);

  return { epic, epicSlug, epicCollaborators };
};
