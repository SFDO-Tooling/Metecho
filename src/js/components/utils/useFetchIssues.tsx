import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { GithubIssue } from 'src/js/store/projects/reducer';

import { ThunkDispatch } from '@/js/store';
import { addUrlParams } from '@/js/utils/api';
import apiFetch from '@/js/utils/api';

export default ({
  projectId,
  isOpen,
  isAttached,
}: {
  projectId: string;
  isAttached: boolean;
  isOpen: boolean;
}) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [issues, setIssues] = useState<GithubIssue[]>();

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
      setIssues(payload?.results || []);
    };
    if (projectId && isOpen) {
      fetchIssues();
    }
  }, [dispatch, projectId, isOpen, isAttached]);

  return { issues };
};
