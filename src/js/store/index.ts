import { History } from 'history';
import { AnyAction, combineReducers } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import epicsReducer, { EpicsState } from '_js/store/epics/reducer';
import errorsReducer, { ErrorType } from '_js/store/errors/reducer';
import orgReducer, { OrgState } from '_js/store/orgs/reducer';
import projectsReducer, { ProjectsState } from '_js/store/projects/reducer';
import socketReducer, { Socket } from '_js/store/socket/reducer';
import taskReducer, { TaskState } from '_js/store/tasks/reducer';
import toastsReducer, { ToastType } from '_js/store/toasts/reducer';
import userReducer, { User } from '_js/store/user/reducer';

export interface AppState {
  errors: ErrorType[];
  toasts: ToastType[];
  orgs: OrgState;
  epics: EpicsState;
  projects: ProjectsState;
  socket: Socket;
  tasks: TaskState;
  user: User | null;
}

export type ThunkResult<A = AnyAction | Promise<AnyAction>> = ThunkAction<
  A,
  AppState,
  History,
  AnyAction
>;
export type ThunkDispatch = ReduxThunkDispatch<AppState, History, AnyAction>;

const reducer = combineReducers({
  toasts: toastsReducer,
  errors: errorsReducer,
  orgs: orgReducer,
  epics: epicsReducer,
  projects: projectsReducer,
  socket: socketReducer,
  tasks: taskReducer,
  user: userReducer,
});

export default reducer;
