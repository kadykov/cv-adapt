import React from 'react';
import { RegisterForm } from './RegisterForm';
import { AuthProvider } from '../context/AuthContext';

export function RegisterFormWithAuth() {
  return (
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  );
}
