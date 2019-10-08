import { ToastAction } from '@/store/toasts/actions';

export interface ToastType {
  id?: string;
  heading: string;
  linkText?: string;
  linkUrl?: string;
  openLinkInNewWindow?: boolean;
  details?: string;
  variant?: 'error' | 'info' | 'success' | 'warning';
}

const reducer = (
  toasts: ToastType[] = [],
  action: ToastAction,
): ToastType[] => {
  switch (action.type) {
    case 'TOAST_ADDED':
      return [...toasts, action.payload];
    case 'TOAST_REMOVED':
      return toasts.filter((toast) => toast.id !== action.payload);
    case 'TOASTS_CLEARED':
      return [];
  }
  return toasts;
};

export default reducer;
