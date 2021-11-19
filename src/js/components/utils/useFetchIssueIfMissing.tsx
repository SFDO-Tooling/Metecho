import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AppState, ThunkDispatch } from '@/js/store';
import { fetchObject } from '@/js/store/actions';
import { selectIssue } from '@/js/store/githubIssues/selectors';
import { OBJECT_TYPES } from '@/js/utils/constants';

export default ({ id }: { id: string }) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectIssueWithArgs = useCallback(selectIssue, []);
  const issue = useSelector((state: AppState) =>
    selectIssueWithArgs(state, id),
  );

  useEffect(() => {
    if (id && issue === undefined) {
      // Fetch issue from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.GITHUB_ISSUE,
          filters: { id },
        }),
      );
    }
  }, [dispatch, id, issue]);

  return { issue };
};
