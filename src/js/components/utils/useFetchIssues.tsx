import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/js/store';
import { addUrlParams } from '@/js/utils/api';
import apiFetch from '@/js/utils/api';

export default ({ projectId }: { projectId: string }) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [issues, setIssues] = useState<any[]>();

  useEffect(() => {
    const baseUrl = window.api_urls.issue_list();
    const fetchIssues = async () => {
      const payload = await apiFetch({
        url: addUrlParams(baseUrl, {
          project: projectId,
        }),
        dispatch,
      });
      setIssues(payload?.results || []);
    };
    if (projectId && !issues) {
      fetchIssues();
    }
  }, [dispatch, issues, projectId]);

  return { issues };
};
