import React from 'react';
import { Task } from 'src/js/store/tasks/reducer';

import TaskTable from '@/js/components/tasks/table';
import useFetchUserTasks from '@/js/components/utils/useFetchUserTasks';

const UserTasks = () => {
  const fetchedTasks = useFetchUserTasks();
  const tasks = fetchedTasks.tasks;

  return (
    <>
      {tasks?.length ? (
        <div className="slds-m-top_xx-large">
          <div className="slds-text-heading_large slds-m-bottom_small">
            Tasks With Unretrieved Changes
          </div>
          <div className="slds-m-bottom_medium slds-text-body_regular">
            Below is a list of Tasks where you are currently assigned as the
            Developer or Tester. If you have any Dev Orgs with unsaved work,
            access them from the Task page to retrieve changes before deleting
            your account.
          </div>

          {tasks && fetchedTasks.fetched && (
            <TaskTable
              tasks={tasks as Task[]}
              isFetched={Boolean(tasks)}
              canAssign={false}
              isRefreshingUsers={false}
              viewEpicsColumn={true}
            />
          )}
        </div>
      ) : (
        <></>
      )}
    </>
  );
};
export default UserTasks;
