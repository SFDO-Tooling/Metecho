import { ToastAction } from '@/js/store/toasts/actions';

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
    case 'TOAST_ADDED': {
      const toast = action.payload;
      let newToasts;
      if (!toast.variant || toast.variant === 'success') {
        // If new toast is a success toast, remove other success toasts...
        newToasts = toasts.filter((t) => t.variant && t.variant !== 'success');
      } else {
        newToasts = [...toasts];
      }
      newToasts.push(toast);
      return newToasts;
    }
    case 'TOAST_REMOVED':
      return toasts.filter((toast) => toast.id !== action.payload);
    case 'TOASTS_CLEARED':
      return [];
  }
  return toasts;
};

export default reducer;
