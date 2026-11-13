import { UserRole, Profile } from '@/types';

export interface AuthState {
  user: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

