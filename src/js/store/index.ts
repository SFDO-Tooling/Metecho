import { AnyAction, combineReducers, Reducer } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import errorsReducer, { ErrorType } from '@/store/errors/reducer';
import orgReducer, { OrgState } from '@/store/orgs/reducer';
import projectsReducer, { ProjectsState } from '@/store/projects/reducer';
import repositoriesReducer, {
  RepositoriesState,
} from '@/store/repositories/reducer';
import socketReducer, { Socket } from '@/store/socket/reducer';
import taskReducer, { TaskState } from '@/store/tasks/reducer';
import toastsReducer, { ToastType } from '@/store/toasts/reducer';
import userReducer, { User } from '@/store/user/reducer';

export interface AppState {
  errors: ErrorType[];
  toasts: ToastType[];
  orgs: OrgState;
  projects: ProjectsState;
  repositories: RepositoriesState;
  socket: Socket;
  tasks: TaskState;
  user: User | null;
}

export type ThunkResult<A = AnyAction | Promise<AnyAction>> = ThunkAction<
  A,
  AppState,
  void,
  AnyAction
>;
export type ThunkDispatch = ReduxThunkDispatch<AppState, void, AnyAction>;

const reducer: Reducer<AppState> = combineReducers({
  toasts: toastsReducer,
  errors: errorsReducer,
  orgs: orgReducer,
  projects: projectsReducer,
  repositories: repositoriesReducer,
  socket: socketReducer,
  tasks: taskReducer,
  user: userReducer,
});

export default reducer;
