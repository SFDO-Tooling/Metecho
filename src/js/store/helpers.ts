import { AppState } from '@/store';

export const isCurrentUser = (id: string | null, state: AppState) => {
  const { user } = state;
  return Boolean(id && user?.id === id);
};
