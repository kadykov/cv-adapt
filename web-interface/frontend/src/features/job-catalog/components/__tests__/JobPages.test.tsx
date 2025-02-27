import { render, screen, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { CreateJobPage, EditJobPage, JobDetailPage } from '../JobPages';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../auth/components/AuthProvider';

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

// Helper to render with providers and routes
function renderWithRouter(
  ui: React.ReactNode,
  initialEntry = '/',
  queryClient?: QueryClient,
) {
  // Create query client if not provided
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

  // Mock successful auth state
  client.setQueryData(['auth'], {
    user: { id: 1, email: 'test@example.com' },
  });

  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/jobs" element={<div>Jobs List</div>} />
            <Route path="/jobs/:id" element={<JobDetailView />} />
            {ui}
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return {
    ...result,
    client,
  };
}

// Setup MSW handlers
import { http, HttpResponse } from 'msw';
import { addIntegrationHandlers } from '../../../../lib/test/integration';

const mockJob = {
  id: 123,
  title: 'Frontend Developer',
  description: 'Building user interfaces',
  language_code: 'en',
  created_at: '2024-02-17T12:00:00Z',
  updated_at: null,
};

// Setup server and handlers
import { server } from '../../../../lib/test/integration';

// Reset handlers before each test
beforeEach(() => {
  server.resetHandlers();
  addIntegrationHandlers([
    http.get('/v1/api/jobs/:id', ({ params }) => {
      if (params.id === '123') {
        return HttpResponse.json(mockJob, { status: 200 });
      }
    }),
  ]);
});

// Clean up after tests
afterEach(() => {
  server.resetHandlers();
});

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

    it('renders JobForm in edit mode', async () => {
      // Create query client and pre-populate data
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 0,
            gcTime: 0,
          },
        },
      });
      queryClient.setQueryData(['job', 123], mockJob);

      renderWithRouter(
        <Route path="/jobs/:id/edit" element={<EditJobPage />} />,
        `/jobs/${jobId}/edit`,
        queryClient,
      );

      // Should render immediately since we pre-populated the data
      expect(screen.getByText(/job form \(edit\)/i)).toBeInTheDocument();
    });

    it('navigates back to job detail on cancel', async () => {
      renderWithRouter(
        <Route path="/jobs/:id/edit" element={<EditJobPage />} />,
        `/jobs/${jobId}/edit`,
      );

      // Wait for form to be rendered
      await waitFor(
        () => {
          expect(screen.getByText(/job form \(edit\)/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const cancelButton = screen.getByText('Cancel');
      await act(async () => {
        cancelButton.click();
      });

      expect(screen.getByText(`Job Detail: ${jobId}`)).toBeInTheDocument();
    });

    it('navigates back to job detail on success', async () => {
      renderWithRouter(
        <Route path="/jobs/:id/edit" element={<EditJobPage />} />,
        `/jobs/${jobId}/edit`,
      );

      // Wait for form to be rendered
      await waitFor(
        () => {
          expect(screen.getByText(/job form \(edit\)/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const saveButton = screen.getByText('Save');
      await act(async () => {
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
