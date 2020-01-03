import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { AppState, ThunkDispatch } from '@/store';
import { fetchObjects } from '@/store/actions';
import { Org } from '@/store/orgs/reducer';
import { selectOrgsByTask } from '@/store/orgs/selectors';
import { Task } from '@/store/tasks/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES } from '@/utils/constants';

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
          shouldSubscribeToObject: (object: Org) =>
            Boolean(object && user && object.owner === user.id),
        }),
      );
    }
  }, [dispatch, task, orgs, user]);

  return { orgs };
};
