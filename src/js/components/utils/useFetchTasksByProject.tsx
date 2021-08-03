import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/js/store';
import { Task } from '@/js/store/tasks/reducer';
import apiFetch from '@/js/utils/api';
import { addUrlParams } from '@/js/utils/api';

export default (projectId?: string, tasksTabViewed?: boolean) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [tasks, setTasks] = useState<Task[]>();

  useEffect(() => {
    const maybeFetchTasks = async () => {
      if (projectId && !tasks && tasksTabViewed) {
        // Fetch tasks from API
        const response: Task[] | null = await apiFetch({
          url: addUrlParams(window.api_urls.task_list(), {
            epic__project: projectId,
          }),
          dispatch,
        });
        setTasks(response || /* istanbul ignore next */ []);
      }
    };

    maybeFetchTasks();
  }, [dispatch, projectId, tasks, tasksTabViewed]);

  // Allow for manually updating Tasks in State...
  // @@@ This list of tasks should be moved to the Redux store...
  /* istanbul ignore next */
  const updateTask = (task: Task) => {
    if (tasks) {
      const existingTask = tasks.find((t) => t.id === task.id);
      if (existingTask) {
        setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
      } else {
        setTasks([task, ...tasks]);
      }
    }
  };

  return { tasks, updateTask };
};
