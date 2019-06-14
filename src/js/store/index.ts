import { combineReducers, Reducer } from 'redux';

import socketReducer, { Socket } from 'store/socket/reducer';
import userReducer, { User } from 'store/user/reducer';

export interface AppState {
  user: User | null;
  socket: Socket;
}

export interface Action {
  type: string;
  payload?: any;
}

const reducer: Reducer<AppState, Action> = combineReducers({
  user: userReducer,
  socket: socketReducer,
});

export default reducer;
