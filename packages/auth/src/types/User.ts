// User entity types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  language?: string;
}

export interface User {
  sub: string; // Unique identifier (from OAuth provider)
  email: string; // User email
  name?: string; // User display name
  profileImage?: string; // Avatar/profile picture URL
  preferences?: UserPreferences; // User settings
  createdAt: Date; // Account creation time
  updatedAt: Date; // Last profile update
}
