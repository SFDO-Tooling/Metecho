import { UserAction } from '@/store/user/actions';

export interface User {
  id: string;
  username: string;
  email: string;
  is_staff: boolean;
}

const reducer = (
  state: User | null = null,
  action: UserAction,
): User | null => {
  switch (action.type) {
    case 'USER_LOGGED_IN':
      return action.payload;
    case 'USER_LOGGED_OUT':
      return null;
  }
  return state;
};

export default reducer;
