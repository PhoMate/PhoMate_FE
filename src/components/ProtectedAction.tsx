import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';

type ProtectedActionProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ProtectedAction({ children, fallback }: ProtectedActionProps) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="login-required">
        <p>이 기능은 로그인이 필요합니다.</p>
        {fallback || <LoginPage />}
      </div>
    );
  }

  return <>{children}</>;
}