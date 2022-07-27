import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import TaskTable from '@/js/components/tasks/table';
import { ThunkDispatch } from '@/js/store';
import { PaginatedObjectResponse } from '@/js/store/actions';
import { Task } from '@/js/store/tasks/reducer';
import apiFetch, { addUrlParams } from '@/js/utils/api';

const UserTasks = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [next, setNext] = useState<string | null | undefined>();
  const [count, setCount] = useState<number | undefined>();

  const url =
    next ??
    addUrlParams(window.api_urls.task_list(), {
      assigned_to_me: true,
    });

  const fetchTasks = useCallback(async () => {
    const payload: PaginatedObjectResponse | null = await apiFetch({
      url,
      dispatch,
    });
    setTasks([
      ...tasks,
      ...(payload?.results || /* istanbul ignore next */ []),
    ]);
    setNext(payload?.next);
    setCount(payload?.count);
  }, [dispatch, tasks, url]);

  // Fetch once initially
  useEffect(() => {
    fetchTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return tasks.length ? (
    <div className="slds-m-top_xx-large">
      <div className="slds-text-heading_large slds-m-bottom_small">
        {t('Your Tasks')}
      </div>
      <div className="slds-m-bottom_medium slds-text-body_regular">
        <Trans i18nKey="myTasks">
          Below is a list of Tasks where you are currently assigned as the
          Developer or Tester. If you have any Dev Orgs with unsaved work,
          access them from the Task page to retrieve changes before deleting
          your account.
        </Trans>
      </div>

      <TaskTable
        tasks={tasks}
        next={next}
        count={count}
        isFetched
        canAssign={false}
        isRefreshingUsers={false}
        viewEpicsColumn
        fetchNextPage={fetchTasks}
      />
    </div>
  ) : null;
};
export default UserTasks;
