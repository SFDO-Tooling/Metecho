import apiFetch from '~js/utils/api';
import { addUrlParams } from '~js/utils/api';
import { ThunkDispatch } from '~js/store';
import { Task } from '~js/store/tasks/reducer';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

export default (projectId?: string) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [tasks, setTasks] = useState<Task[]>();
  useEffect(() => {
    const fetchTasks = async () => {
      if (projectId && !tasks) {
        // Fetch tasks from API
        const response: Task[] | null = await apiFetch({
          url: addUrlParams(window.api_urls.task_list(), {
            project: projectId,
          }),
          // This isn't strictly needed, but allows any API errors to be displayed in a global message
          dispatch,
        });
        setTasks(response || []);
      }
    };
    fetchTasks();
  }, [dispatch, projectId, tasks]);
  return tasks;
};
