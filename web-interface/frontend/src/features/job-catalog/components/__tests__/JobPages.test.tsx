import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { CreateJobPage, EditJobPage, JobDetailPage } from '../JobPages';

interface JobFormProps {
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

// Mock job detail component that displays the ID from route params
function JobDetailView() {
  const { id } = useParams();
  return <div>Job Detail: {id}</div>;
}

// Mock the job components
vi.mock('../JobForm', () => ({
  JobForm: ({ mode, onSuccess, onCancel }: JobFormProps) => (
    <div>
      Job Form ({mode})<button onClick={onSuccess}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../JobDetail', () => ({
  JobDetail: ({ id }: { id: number }) => <div>Job Detail (ID: {id})</div>,
}));

// Helper to render with routes
function renderWithRouter(ui: React.ReactNode, initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/jobs" element={<div>Jobs List</div>} />
        <Route path="/jobs/:id" element={<JobDetailView />} />
        {ui}
      </Routes>
    </MemoryRouter>,
  );
}

describe('JobPages', () => {
  describe('CreateJobPage', () => {
    it('renders JobForm in create mode', () => {
      renderWithRouter(
        <Route path="/jobs/new" element={<CreateJobPage />} />,
        '/jobs/new',
      );
      expect(screen.getByText(/job form \(create\)/i)).toBeInTheDocument();
    });

    it('navigates back to jobs list on cancel', async () => {
      renderWithRouter(
        <Route path="/jobs/new" element={<CreateJobPage />} />,
        '/jobs/new',
      );

      await act(async () => {
        const cancelButton = screen.getByText('Cancel');
        cancelButton.click();
      });

      expect(screen.getByText('Jobs List')).toBeInTheDocument();
    });

    it('navigates back to jobs list on success', async () => {
      renderWithRouter(
        <Route path="/jobs/new" element={<CreateJobPage />} />,
        '/jobs/new',
      );

      await act(async () => {
        const saveButton = screen.getByText('Save');
        saveButton.click();
      });

      expect(screen.getByText('Jobs List')).toBeInTheDocument();
    });
  });

  describe('EditJobPage', () => {
    const jobId = '123';

    it('renders JobForm in edit mode', () => {
      renderWithRouter(
        <Route path="/jobs/:id/edit" element={<EditJobPage />} />,
        `/jobs/${jobId}/edit`,
      );
      expect(screen.getByText(/job form \(edit\)/i)).toBeInTheDocument();
    });

    it('navigates back to job detail on cancel', async () => {
      renderWithRouter(
        <Route path="/jobs/:id/edit" element={<EditJobPage />} />,
        `/jobs/${jobId}/edit`,
      );

      await act(async () => {
        const cancelButton = screen.getByText('Cancel');
        cancelButton.click();
      });

      expect(screen.getByText(`Job Detail: ${jobId}`)).toBeInTheDocument();
    });

    it('navigates back to job detail on success', async () => {
      renderWithRouter(
        <Route path="/jobs/:id/edit" element={<EditJobPage />} />,
        `/jobs/${jobId}/edit`,
      );

      await act(async () => {
        const saveButton = screen.getByText('Save');
        saveButton.click();
      });

      expect(screen.getByText(`Job Detail: ${jobId}`)).toBeInTheDocument();
    });
  });

  describe('JobDetailPage', () => {
    it('renders JobDetail with parsed ID', () => {
      const jobId = '123';
      renderWithRouter(
        <Route path="/jobs/:id" element={<JobDetailPage />} />,
        `/jobs/${jobId}`,
      );
      expect(screen.getByText(`Job Detail: ${jobId}`)).toBeInTheDocument();
    });
  });
});
