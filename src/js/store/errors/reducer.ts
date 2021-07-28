import { ErrorAction } from '@/js/store/errors/actions';

export interface ErrorType {
  id: string;
  message: string;
}

const reducer = (
  errors: ErrorType[] = [],
  action: ErrorAction,
): ErrorType[] => {
  switch (action.type) {
    case 'ERROR_ADDED':
      return [...errors, action.payload];
    case 'ERROR_REMOVED':
      return errors.filter((err) => err.id !== action.payload);
    case 'ERRORS_CLEARED':
      return [];
  }
  return errors;
};

export default reducer;
