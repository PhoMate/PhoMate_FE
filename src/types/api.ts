export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

export interface Photo {
  id: string;
  url: string;
  title?: string;
  createdAt: string;
  userId: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}