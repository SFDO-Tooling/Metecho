import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '_js/store';
import { fetchObjects } from '_js/store/actions';
import { Epic } from '_js/store/epics/reducer';
import { Org } from '_js/store/orgs/reducer';
import {
  selectOrgsByTask,
  selectPlaygroundOrgsByEpic,
  selectPlaygroundOrgsByProject,
} from '_js/store/orgs/selectors';
import { Project } from '_js/store/projects/reducer';
import { Task } from '_js/store/tasks/reducer';
import { selectUserState } from '_js/store/user/selectors';
import { OBJECT_TYPES } from '_js/utils/constants';

export default ({
  task,
  epic,
  project,
  props,
}: {
  task?: Task | null;
  epic?: Epic | null;
  project?: Project | null;
  props: RouteComponentProps;
}): { orgs: Org[] | undefined } => {
  const dispatch = useDispatch<ThunkDispatch>();
  const user = useSelector(selectUserState);
  const selectTaskOrgsWithProps = useCallback(selectOrgsByTask, []);
  const taskOrgs = useSelector((state: AppState) =>
    selectTaskOrgsWithProps(state, props),
  );
  const selectEpicOrgsWithProps = useCallback(selectPlaygroundOrgsByEpic, []);
  const epicOrgs = useSelector((state: AppState) =>
    selectEpicOrgsWithProps(state, props),
  );
  const selectProjectOrgsWithProps = useCallback(
    selectPlaygroundOrgsByProject,
    [],
  );
  const projectOrgs = useSelector((state: AppState) =>
    selectProjectOrgsWithProps(state, props),
  );

  useEffect(() => {
    if (task && !taskOrgs) {
      // Fetch orgs from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.ORG,
          filters: { task: task.id },
        }),
      );
    } else if (epic && !epicOrgs) {
      // Fetch orgs from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.ORG,
          filters: { epic: epic.id },
        }),
      );
    } else if (project && !projectOrgs) {
      // Fetch orgs from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.ORG,
          filters: { project: project.id },
        }),
      );
    }
  }, [dispatch, task, epic, project, taskOrgs, epicOrgs, projectOrgs, user]);

  if (task) {
    return { orgs: taskOrgs };
  } else if (epic) {
    return { orgs: epicOrgs };
  } else if (project) {
    return { orgs: projectOrgs };
  }
  return { orgs: undefined };
};
