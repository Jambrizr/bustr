export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  birthday: string | null;
  state: string | null;
  subscription_plan: 'freemium' | 'core' | 'premium';
  role: string;
  data_retention_preference: 'immediate' | '6 hours' | '7 days' | '30 days' | '60 days';
  remember_me: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}

export interface AuthSession {
  user: AuthUser | null;
  token: string | null;
}