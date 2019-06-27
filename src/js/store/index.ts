import { AnyAction, combineReducers, Reducer } from 'redux';
import { ThunkAction } from 'redux-thunk';

import productsReducer, { ProductsState } from '@/store/products/reducer';
import socketReducer, { Socket } from '@/store/socket/reducer';
import userReducer, { User } from '@/store/user/reducer';

export interface AppState {
  products: ProductsState;
  socket: Socket;
  user: User | null;
}

export interface Action {
  type: string;
  payload?: any;
}

export type ThunkResult = ThunkAction<Promise<any>, AppState, void, AnyAction>;

const reducer: Reducer<AppState, Action> = combineReducers({
  products: productsReducer,
  socket: socketReducer,
  user: userReducer,
});

export default reducer;
