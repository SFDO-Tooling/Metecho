import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { Org } from '@/js/store/orgs/reducer';
import {
  selectOrgsByTask,
  selectPlaygroundOrgsByEpic,
  selectPlaygroundOrgsByProject,
} from '@/js/store/orgs/selectors';
import { selectUserState } from '@/js/store/user/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default (
  {
    taskId,
    epicId,
    projectId,
  }: {
    taskId?: string;
    epicId?: string;
    projectId?: string;
  },
  routeProps: RouteComponentProps,
): { orgs: Org[] | undefined } => {
  const dispatch = useDispatch<ThunkDispatch>();
  const user = useSelector(selectUserState);
  const selectTaskOrgsWithProps = useCallback(selectOrgsByTask, []);
  const taskOrgs = useSelector((state: AppState) =>
    selectTaskOrgsWithProps(state, routeProps),
  );
  const selectEpicOrgsWithProps = useCallback(selectPlaygroundOrgsByEpic, []);
  const epicOrgs = useSelector((state: AppState) =>
    selectEpicOrgsWithProps(state, routeProps),
  );
  const selectProjectOrgsWithProps = useCallback(
    selectPlaygroundOrgsByProject,
    [],
  );
  const projectOrgs = useSelector((state: AppState) =>
    selectProjectOrgsWithProps(state, routeProps),
  );

  useEffect(() => {
    if (taskId && !taskOrgs) {
      // Fetch orgs from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.ORG,
          filters: { task: taskId },
        }),
      );
    } else if (epicId && !epicOrgs) {
      // Fetch orgs from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.ORG,
          filters: { epic: epicId },
        }),
      );
    } else if (projectId && !projectOrgs) {
      // Fetch orgs from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.ORG,
          filters: { project: projectId },
        }),
      );
    }
  }, [
    dispatch,
    taskId,
    epicId,
    projectId,
    taskOrgs,
    epicOrgs,
    projectOrgs,
    user,
  ]);

  if (taskId) {
    return { orgs: taskOrgs };
  } else if (epicId) {
    return { orgs: epicOrgs };
  } else if (projectId) {
    return { orgs: projectOrgs };
  }
  return { orgs: undefined };
};
