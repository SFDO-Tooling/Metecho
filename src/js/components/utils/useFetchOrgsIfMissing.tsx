import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '~js/store';
import { fetchObjects } from '~js/store/actions';
import { selectOrgsByTask } from '~js/store/orgs/selectors';
import { Task } from '~js/store/tasks/reducer';
import { selectUserState } from '~js/store/user/selectors';
import { OBJECT_TYPES } from '~js/utils/constants';

export default (
  task: Task | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const user = useSelector(selectUserState);
  const selectOrgsWithProps = useCallback(selectOrgsByTask, []);
  const orgs = useSelector((state: AppState) =>
    selectOrgsWithProps(state, routeProps),
  );

  useEffect(() => {
    if (task && !orgs) {
      // Fetch orgs from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.ORG,
          filters: { task: task.id },
        }),
      );
    }
  }, [dispatch, task, orgs, user]);

  return { orgs };
};
