import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/js/store';
import { Task } from '@/js/store/tasks/reducer';
import apiFetch, { addUrlParams } from '@/js/utils/api';

export default () => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [tasks, setTasks] = useState<Task[]>();
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const baseUrl = window.api_urls.task_list();
    const fetchTasks = async () => {
      const payload = await apiFetch({
        url: addUrlParams(baseUrl, {
          assigned_to_me: true,
        }),
        dispatch,
      });
      setTasks(payload?.results || /* istanbul ignore next */ []);
      setFetched(true);
    };
    fetchTasks();
  }, [dispatch, fetched]);

  return { tasks, fetched };
};
