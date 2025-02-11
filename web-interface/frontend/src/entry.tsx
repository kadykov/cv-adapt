import React from 'react';
import { AuthProvider } from './features/auth/context/AuthContext';

interface ClientEntryProps {
  children: React.ReactNode;
}

export function ClientEntry({ children }: ClientEntryProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

export default ClientEntry;
