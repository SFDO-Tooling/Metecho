import apiFetch from '~js/utils/api';
import { addUrlParams } from '~js/utils/api';

export default (
  project: any
) => {
  let tasks;
  apiFetch({ url: addUrlParams(window.api_urls.task_list(), { project: project.id }), dispatch: null }).then(data => {
    tasks = data;
  })
  return tasks;
};
