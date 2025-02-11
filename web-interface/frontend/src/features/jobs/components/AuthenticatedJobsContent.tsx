import React from 'react';
import { AuthProvider } from '../../auth/context/AuthContext';
import { JobsPage } from '../JobsPage';

export function AuthenticatedJobsContent() {
  return (
    <AuthProvider>
      <div className="container mx-auto px-4">
        <JobsPage />
      </div>
    </AuthProvider>
  );
}
