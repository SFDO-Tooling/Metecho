import { History } from 'history';
import { RouteComponentProps } from 'react-router-dom';
import { AnyAction, combineReducers } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import epicsReducer, { EpicsState } from '@/js/store/epics/reducer';
import errorsReducer, { ErrorType } from '@/js/store/errors/reducer';
import issuesReducer, { IssuesState } from '@/js/store/githubIssues/reducer';
import orgReducer, { OrgState } from '@/js/store/orgs/reducer';
import projectsReducer, { ProjectsState } from '@/js/store/projects/reducer';
import socketReducer, { Socket } from '@/js/store/socket/reducer';
import taskReducer, { TaskState } from '@/js/store/tasks/reducer';
import toastsReducer, { ToastType } from '@/js/store/toasts/reducer';
import userReducer, { User } from '@/js/store/user/reducer';

export interface AppState {
  errors: ErrorType[];
  toasts: ToastType[];
  orgs: OrgState;
  epics: EpicsState;
  projects: ProjectsState;
  socket: Socket;
  tasks: TaskState;
  issues: IssuesState;
  user: User | null;
}

export type ThunkResult<A = AnyAction | Promise<AnyAction>> = ThunkAction<
  A,
  AppState,
  History,
  AnyAction
>;
export type ThunkDispatch = ReduxThunkDispatch<AppState, History, AnyAction>;
export type RouteProps = RouteComponentProps<{
  projectSlug?: string;
  epicSlug?: string;
  taskSlug?: string;
}>;

const reducer = combineReducers({
  toasts: toastsReducer,
  errors: errorsReducer,
  orgs: orgReducer,
  epics: epicsReducer,
  projects: projectsReducer,
  socket: socketReducer,
  tasks: taskReducer,
  issues: issuesReducer,
  user: userReducer,
});

export default reducer;
