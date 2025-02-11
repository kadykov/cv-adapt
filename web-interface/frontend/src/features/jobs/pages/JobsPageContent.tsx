import React from 'react';
import { JobsPage } from '../JobsPage';

export function JobsPageContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <JobsPage />
      </main>
    </div>
  );
}
