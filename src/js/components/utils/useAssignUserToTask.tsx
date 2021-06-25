import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { Task } from '~js/store/tasks/reducer';
import { ORG_TYPES, OrgTypes, OBJECT_TYPES } from '~js/utils/constants';
import { ThunkDispatch } from '~js/store';
import { updateObject } from '~js/store/actions';

// "Assign user to task" modal related:
export default () => {
  const dispatch = useDispatch<ThunkDispatch>();
  useCallback(
    ({
      task,
      type,
      assignee,
      shouldAlertAssignee,
    }: {
      task: Task;
      type: OrgTypes;
      assignee: string | null;
      shouldAlertAssignee: boolean;
    }) => {
      /* istanbul ignore next */
      const userType = type === ORG_TYPES.DEV ? 'assigned_dev' : 'assigned_qa';
      const alertType =
        type === ORG_TYPES.DEV ? 'should_alert_dev' : 'should_alert_qa';

      dispatch(
        updateObject({
          objectType: OBJECT_TYPES.TASK,
          url: window.api_urls.task_assignees(task.id),
          data: {
            [userType]: assignee,
            [alertType]: shouldAlertAssignee,
          },
        }),
      );
    },
    [dispatch],
  );
};
