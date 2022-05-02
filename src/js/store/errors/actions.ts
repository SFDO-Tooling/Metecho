import uuid from 'uuid-random';

import { ErrorType } from '@/js/store/errors/reducer';

interface AddErrorAction {
  type: 'ERROR_ADDED';
  payload: ErrorType;
}
export interface RemoveErrorAction {
  type: 'ERROR_REMOVED';
  payload: string;
}
export interface ClearErrorsAction {
  type: 'ERRORS_CLEARED';
}
export type ErrorAction =
  | AddErrorAction
  | RemoveErrorAction
  | ClearErrorsAction;

export const addError = (msg: string): AddErrorAction => ({
  type: 'ERROR_ADDED',
  payload: {
    id: uuid(),
    message: msg,
  },
});

export const removeError = (id: string): RemoveErrorAction => ({
  type: 'ERROR_REMOVED',
  payload: id,
});

export const clearErrors = (): ClearErrorsAction => ({
  type: 'ERRORS_CLEARED',
});
