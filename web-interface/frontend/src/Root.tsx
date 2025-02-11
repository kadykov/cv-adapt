import React from 'react';
import { AuthProvider } from './features/auth/context/AuthContext';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
