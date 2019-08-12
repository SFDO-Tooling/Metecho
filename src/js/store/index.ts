import { AnyAction, combineReducers, Reducer } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import errorsReducer, { ErrorType } from '@/store/errors/reducer';
import repositoriesReducer, {
  RepositoriesState,
} from '@/store/repositories/reducer';
import projectsReducer, { ProjectsState } from '@/store/projects/reducer';
import socketReducer, { Socket } from '@/store/socket/reducer';
import taskReducer, { TaskState } from '@/store/tasks/reducer';
import userReducer, { User } from '@/store/user/reducer';

export interface AppState {
  errors: ErrorType[];
  repositories: RepositoriesState;
  projects: ProjectsState;
  socket: Socket;
  user: User | null;
  tasks: TaskState;
}

export interface Action {
  type: string;
  payload?: any;
}

export type ThunkResult = ThunkAction<Promise<any>, AppState, void, AnyAction>;
export type ThunkDispatch = ReduxThunkDispatch<AppState, void, AnyAction>;

const reducer: Reducer<AppState, Action> = combineReducers({
  errors: errorsReducer,
  repositories: repositoriesReducer,
  projects: projectsReducer,
  socket: socketReducer,
  user: userReducer,
  tasks: taskReducer,
});

export default reducer;
