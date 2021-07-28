import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '_js/store';
import { fetchObject } from '_js/store/actions';
import { selectEpic, selectEpicSlug } from '_js/store/epics/selectors';
import { Project } from '_js/store/projects/reducer';
import { OBJECT_TYPES } from '_js/utils/constants';

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
