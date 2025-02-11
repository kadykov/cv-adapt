import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { LoginForm } from './LoginForm';

export function AuthenticatedLoginForm() {
  return (
    <AuthProvider>
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto mt-16">
          <h1 className="text-2xl font-bold mb-6 text-center">Sign in to CV Adapter</h1>
          <LoginForm />
        </div>
      </div>
    </AuthProvider>
  );
}
