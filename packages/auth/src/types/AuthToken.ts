// Authentication token types
export interface AuthToken {
  accessToken: string; // Current access token
  accessExpiry: Date; // When access token expires
  refreshToken?: string; // Refresh token for getting new access token
  refreshExpiry?: Date; // When refresh token expires
}

export interface SessionState {
  user: any | null; // Current authenticated user (will import User type later)
  token: AuthToken | null; // Current tokens
  isAuthenticated: boolean; // Whether user is logged in
  isLoading: boolean; // Loading state during auth flow
  error?: string; // Auth error message if any
}
