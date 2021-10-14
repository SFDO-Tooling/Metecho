import { useEffect, useRef } from 'react';

import { addUrlParams } from '@/js/utils/api';
import apiFetch from '@/js/utils/api';

export default ({ projectId }: { projectId: string }) => {
  const issues = useRef({});
  useEffect(() => {
    const baseUrl = window.api_urls.issue_list();
    apiFetch({
      url: addUrlParams(baseUrl, {
        project: projectId,
      }),
    }).then((payload) => {
      issues.current = payload;
    });
  });

  return { issues };
};
