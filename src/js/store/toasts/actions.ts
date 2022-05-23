import uuid from 'uuid-random';

import { ToastType } from '@/js/store/toasts/reducer';

export interface AddToastAction {
  type: 'TOAST_ADDED';
  payload: ToastType;
}
export interface RemoveToastAction {
  type: 'TOAST_REMOVED';
  payload: string;
}
export interface ClearToastsAction {
  type: 'TOASTS_CLEARED';
}
export type ToastAction =
  | AddToastAction
  | RemoveToastAction
  | ClearToastsAction;

export const addToast = (toast: ToastType): AddToastAction => ({
  type: 'TOAST_ADDED',
  payload: {
    ...toast,
    id: uuid(),
  },
});

export const removeToast = (id: string): RemoveToastAction => ({
  type: 'TOAST_REMOVED',
  payload: id,
});

export const clearToasts = (): ClearToastsAction => ({
  type: 'TOASTS_CLEARED',
});
