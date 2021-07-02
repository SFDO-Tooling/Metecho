import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '~js/store';
import { Task } from '~js/store/tasks/reducer';
import apiFetch from '~js/utils/api';
import { addUrlParams } from '~js/utils/api';

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
          dispatch,
        });
        setTasks(response || []);
      }
    };
    fetchTasks();
  }, [dispatch, projectId, tasks]);

  // Allow for manually updating Tasks in State...
  // @@@ Ideally these should be moved to the Redux store?
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
