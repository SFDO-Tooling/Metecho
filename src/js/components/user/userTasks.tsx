import React from 'react';

import UserTasksTable from '@/js/components/user/table';
import useFetchUserTasks from '@/js/components/utils/useFetchUserTasks';

const UserTasks = () => {
  const fetchedTasks = useFetchUserTasks();
  const tasks = fetchedTasks.tasks;

  return (
    <div className="slds-m-top_xx-large">
      <div className="slds-text-heading_large slds-m-bottom_small">
        Tasks With Unretrieved Changes
      </div>
      <div className="slds-m-bottom_medium slds-text-body_regular">
        Below is a list of Tasks where you are currently assigned as the
        Developer or Tester. If you have any Dev Orgs with unsaved work, access
        them from the Task page to retrieve changes before deleting your
        account.
      </div>
      <UserTasksTable
        // projectId={project.id}
        // projectSlug={project.slug}
        tasks={tasks}
        isFetched={Boolean(tasks)}
        // githubUsers={project.github_users}
        // canAssign={project.has_push_permission}
        // isRefreshingUsers={project.currently_fetching_github_users}
        // assignUserAction={assignUser}
        viewEpicsColumn={false}
      />
    </div>
  );
};
export default UserTasks;
