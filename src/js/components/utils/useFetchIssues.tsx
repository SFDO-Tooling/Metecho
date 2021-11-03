import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/js/store';
import { GitHubIssue } from '@/js/store/projects/reducer';
import { addUrlParams } from '@/js/utils/api';
import apiFetch from '@/js/utils/api';

export default ({
  projectId,
  isAttached,
  isOpen,
}: {
  projectId: string;
  isAttached: boolean;
  isOpen: boolean;
}) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [issues, setIssues] = useState<GitHubIssue[]>();

  useEffect(() => {
    const baseUrl = window.api_urls.issue_list();
    const fetchIssues = async () => {
      const payload = await apiFetch({
        url: addUrlParams(baseUrl, {
          project: projectId,
          is_attached: isAttached,
        }),
        dispatch,
      });
      setIssues(payload?.results || /* istanbul ignore next */ []);
    };
    if (projectId && isOpen) {
      fetchIssues();
    }
  }, [dispatch, projectId, isOpen, isAttached]);

  return { issues };
};
