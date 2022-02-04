import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/js/store';
import { GitHubIssue } from '@/js/store/githubIssues/reducer';
import { addUrlParams } from '@/js/utils/api';
import apiFetch from '@/js/utils/api';

export default ({
  projectId,
  isAttached,
  isOpen,
  currentlyResyncing,
  search,
}: {
  projectId: string;
  isAttached: boolean;
  isOpen: boolean;
  currentlyResyncing: boolean;
  search: string;
}) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const [issues, setIssues] = useState<GitHubIssue[]>();
  const [currentlyFetching, setCurrentlyFetching] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const baseUrl = window.api_urls.issue_list();
    const fetchIssues = async () => {
      setCurrentlyFetching(true);
      const payload = await apiFetch({
        url: addUrlParams(baseUrl, {
          project: projectId,
          is_attached: isAttached,
          search: search || undefined,
        }),
        dispatch,
      });
      setIssues(payload?.results || /* istanbul ignore next */ []);
      setCurrentlyFetching(false);
      setCount(payload?.count || /* istanbul ignore next */ 0);
    };
    if (projectId && isOpen && !currentlyResyncing) {
      fetchIssues();
    }
  }, [dispatch, projectId, isOpen, isAttached, currentlyResyncing, search]);

  const clearIssues = () => setIssues(undefined);

  return { issues, currentlyFetching, count, clearIssues };
};
