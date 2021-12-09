import { ObjectsAction } from '@/js/store/actions';
import { Epic } from '@/js/store/epics/reducer';
import { Task } from '@/js/store/tasks/reducer';
import { LogoutAction } from '@/js/store/user/actions';
import { OBJECT_TYPES } from '@/js/utils/constants';

export interface IssueTask
  extends Pick<
    Task,
    | 'id'
    | 'name'
    | 'status'
    | 'review_status'
    | 'review_valid'
    | 'pr_is_open'
    | 'slug'
  > {
  epic_slug: Epic['slug'] | null;
}

export type IssueEpic = Pick<Epic, 'id' | 'name' | 'status' | 'slug'>;

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  created_at: string;
  html_url: string;
  project: string;
  epic: IssueEpic | null;
  task: IssueTask | null;
}

export interface IssuesState {
  issues: GitHubIssue[];
  notFound: string[];
}

const defaultState = {
  issues: [],
  notFound: [],
};

const reducer = (
  state: IssuesState = defaultState,
  action: ObjectsAction | LogoutAction,
): IssuesState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return { ...defaultState };
    case 'FETCH_OBJECT_SUCCEEDED': {
      const {
        object,
        filters: { id },
        objectType,
      } = action.payload;
      if (objectType === OBJECT_TYPES.GITHUB_ISSUE) {
        if (!object) {
          return {
            ...state,
            notFound: [...state.notFound, id],
          };
        }
        if (!state.issues.find((issue) => issue.id === object.id)) {
          return {
            ...state,
            issues: [...state.issues, object],
          };
        }
      }
      return state;
    }
  }
  return state;
};

export default reducer;
