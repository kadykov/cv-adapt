import React from 'react';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="w-full max-w-md mx-auto p-6 flex items-center">
        <div className="w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Sign in to CV Adapter</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
