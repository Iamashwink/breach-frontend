import React from 'react';
import { LoginForm } from './LoginForm';

/**
 * Standalone login route — renders the shared login form full-page.
 */
export const LoginView: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07090F] text-[#D5DBE7] scan-faint flex flex-col">
      <LoginForm />
    </div>
  );
};
