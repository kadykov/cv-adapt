import { describe, test, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import type { RenderOptions } from '@testing-library/react';
import {
  render,
  screen,
  waitFor,
  within,
  createGetHandler,
  createPutHandler,
  createDeleteHandler,
  createEmptyPutHandler,
  addIntegrationHandlers,
} from '../../../../lib/test/integration';
import type { ReactNode } from 'react';
import {
  DetailedCVListPage,
  DetailedCVFormPage,
  DetailedCVDetailPage,
} from '../../components/DetailedCVPages';
import { ROUTES } from '../../../../routes/paths';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { authIntegrationHandlers } from '../../../auth/testing/integration-handlers';
import { IntegrationTestWrapper } from '../../../../lib/test/integration';
import { QueryClient } from '@tanstack/react-query';
import { setupAuthenticatedState } from '../../../auth/testing/setup';
import { LanguageCode } from '../../../../lib/language/types';

describe('Detailed CV Operations Integration', () => {
  // Create RenderOptions type that includes wrapper
  interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    wrapper?: React.ComponentType;
  }

  const RouterWrapper = ({
    children,
    initialEntries,
  }: {
    children: ReactNode;
    initialEntries: string[];
  }) => (
    <IntegrationTestWrapper initialEntries={initialEntries}>
      {children}
    </IntegrationTestWrapper>
  );

  // Mock data with content field as string to match the OpenAPI schema
  const mockDetailedCVs = [
    {
      id: 1,
      user_id: 1,
      language_code: 'en',
      content: '# English CV\n\nThis is my English CV content.',
      is_primary: true,
      created_at: '2024-02-17T12:00:00Z',
      updated_at: null,
    },
    {
      id: 2,
      user_id: 1,
      language_code: 'fr',
      content: '# CV Français\n\nVoici le contenu de mon CV en français.',
      is_primary: false,
      created_at: '2024-02-17T12:00:00Z',
      updated_at: null,
    },
  ];

  const mockNewCV = {
    language_code: LanguageCode.GERMAN,
    content: '# Deutscher Lebenslauf\n\nDies ist mein Lebenslauf auf Deutsch.',
    is_primary: false,
  };

  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: Infinity,
        },
      },
    });
  });

  // Enhanced cleanup after each test
  afterEach(async () => {
    localStorage.clear();
    queryClient.clear();
    await queryClient.resetQueries();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const renderWithAuth = async (
    initialEntries: string[] = [ROUTES.DETAILED_CVS.LIST],
  ) => {
    localStorage.setItem('access_token', 'valid-access-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());

    setupAuthenticatedState(queryClient);

    const wrapper = render(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Welcome to CV Adapt</div>} />
            <Route
              path={ROUTES.DETAILED_CVS.LIST}
              element={<DetailedCVListPage />}
            />
            <Route
              path={ROUTES.DETAILED_CVS.FORM(':languageCode')}
              element={<DetailedCVFormPage />}
            />
            <Route
              path={ROUTES.DETAILED_CVS.DETAIL(':languageCode')}
              element={<DetailedCVDetailPage />}
            />
          </Route>
        </Route>
      </Routes>,
      {
        wrapper: ({ children }: { children: ReactNode }) =>
          RouterWrapper({ children, initialEntries }),
      } as ExtendedRenderOptions,
    );

    await queryClient.resetQueries();

    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    return wrapper;
  };

  // Add auth and detailed CV operation handlers
  beforeEach(() => {
    localStorage.clear();
    addIntegrationHandlers([
      ...authIntegrationHandlers,
      createGetHandler(
        '/user/detailed-cvs',
        'DetailedCVResponse',
        mockDetailedCVs,
      ),
      createGetHandler(
        '/user/detailed-cvs/en',
        'DetailedCVResponse',
        mockDetailedCVs[0],
      ),
      createGetHandler(
        '/user/detailed-cvs/fr',
        'DetailedCVResponse',
        mockDetailedCVs[1],
      ),
      // Return null for initial load to trigger create mode
      createGetHandler('/user/detailed-cvs/de', 'DetailedCVResponse', null, {
        status: 404,
      }),
      createPutHandler(
        '/user/detailed-cvs/de',
        'DetailedCVCreate',
        'DetailedCVResponse',
        {
          id: 3,
          user_id: 1,
          created_at: '2024-02-17T12:00:00Z',
          updated_at: null,
          ...mockNewCV,
        },
      ),
      createEmptyPutHandler(
        '/user/detailed-cvs/fr/primary',
        'DetailedCVResponse',
        {
          ...mockDetailedCVs[1],
          is_primary: true,
          updated_at: '2024-02-17T13:00:00Z',
        },
      ),
      createDeleteHandler('/user/detailed-cvs/fr'),
    ]);
  });

  test('should create a new detailed CV', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'German' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'German' })).toBeVisible();
    });

    // Click Create CV button on the German card
    const germanCard = screen
      .getByRole('heading', { name: 'German' })
      .closest('.card') as HTMLElement;
    const createButton = within(germanCard!).getByRole('button', {
      name: /create detailed cv/i,
    });
    await user.click(createButton);

    // Wait for form to be rendered
    await waitFor(() => {
      expect(screen.getByRole('form')).toBeInTheDocument();
      // Check form title
      const heading = screen.getByRole('heading', { name: /detailed cv$/i });
      expect(heading).toBeInTheDocument();
      // Check language badge
      expect(screen.getByText('German')).toBeInTheDocument();
    });

    // Fill in content
    const contentInput = screen.getByLabelText(/cv content/i);
    await user.type(contentInput, mockNewCV.content);

    // Update handlers for the list response after creation
    addIntegrationHandlers([
      createGetHandler('/user/detailed-cvs', 'DetailedCVResponse', [
        ...mockDetailedCVs,
        {
          id: 3,
          user_id: 1,
          created_at: '2024-02-17T12:00:00Z',
          updated_at: null,
          ...mockNewCV,
        },
      ]),
    ]);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create cv/i });
    await user.click(submitButton);

    // Verify redirect and update
    await waitFor(() => {
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Detailed CVs' }),
      ).toBeInTheDocument();
    });

    // Verify the new CV appears in the list
    await waitFor(() => {
      // Check that there are fewer "No detailed CV" messages (German should be gone)
      const emptyStateElements = screen.queryAllByText(
        'No detailed CV for this language',
      );
      const initialCount = 3; // Spanish, Italian, German
      expect(emptyStateElements).toHaveLength(initialCount - 1);

      // Check for the new CV content
      const cvContent = screen.getByText((content) =>
        content.includes('Deutscher Lebenslauf'),
      );
      expect(cvContent).toBeInTheDocument();
    });
  });

  test('should handle non-existent CV gracefully', async () => {
    // Setup handler for 404 when CV doesn't exist
    addIntegrationHandlers([
      createGetHandler('/user/detailed-cvs/es', 'DetailedCVResponse', null, {
        status: 404,
      }),
    ]);

    const user = userEvent.setup();
    await renderWithAuth([ROUTES.DETAILED_CVS.FORM('es')]);

    // Verify empty form is shown without error
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByText('Spanish')).toBeInTheDocument();
      expect(
        screen.queryByText(/Failed to load CV data/i),
      ).not.toBeInTheDocument();
    });

    // Add handlers for successful creation
    const newSpanishCV = {
      id: 4,
      user_id: 1,
      language_code: 'es',
      content: '# CV en Español\n\nEste es mi CV en español.',
      is_primary: false,
      created_at: '2024-02-17T12:00:00Z',
      updated_at: null,
    };

    addIntegrationHandlers([
      createPutHandler(
        '/user/detailed-cvs/es',
        'DetailedCVCreate',
        'DetailedCVResponse',
        newSpanishCV,
      ),
      createGetHandler('/user/detailed-cvs', 'DetailedCVResponse', [
        ...mockDetailedCVs,
        newSpanishCV,
      ]),
    ]);

    // Fill in content for new CV
    const contentInput = screen.getByLabelText(/cv content/i);
    await user.type(contentInput, newSpanishCV.content);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create cv/i });
    await user.click(submitButton);

    // Verify redirect and update
    await waitFor(() => {
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Detailed CVs' }),
      ).toBeInTheDocument();
      const cvContent = screen.getByText((content) =>
        content.includes('CV en Español'),
      );
      expect(cvContent).toBeInTheDocument();
    });
  });

  test('should edit an existing CV', async () => {
    const user = userEvent.setup();

    const updatedCV = {
      ...mockDetailedCVs[0],
      content: '# Updated English CV\n\nThis is my updated English CV content.',
      updated_at: '2024-02-17T13:00:00Z',
    };

    // Setup handlers for update
    addIntegrationHandlers([
      createPutHandler(
        '/user/detailed-cvs/en',
        'DetailedCVCreate',
        'DetailedCVResponse',
        updatedCV,
      ),
      createGetHandler('/user/detailed-cvs', 'DetailedCVResponse', [
        updatedCV,
        mockDetailedCVs[1],
      ]),
    ]);

    // Start on list page and click English CV to view details
    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    // Wait for CV content to be visible
    let cvButton: HTMLElement | null = null;
    await waitFor(() => {
      const cvElements = screen.getAllByText((content) => {
        return content.toLowerCase().includes('english cv');
      });
      expect(cvElements[0]).toBeInTheDocument();
      cvButton = cvElements[0].closest('[role="button"]');
      expect(cvButton).not.toBeNull();
    });

    // Click CV card to view details
    await user.click(cvButton!);

    // Verify detail page content
    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument(); // Language badge
      expect(
        screen.getByRole('button', { name: /edit detailed cv/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /delete detailed cv/i }),
      ).toBeInTheDocument();
      const detailCvElements = screen.getAllByText((content) => {
        return content.toLowerCase().includes('english cv');
      });
      expect(detailCvElements.length).toBeGreaterThan(0);
    });

    // Click edit button
    await user.click(screen.getByRole('button', { name: /edit detailed cv/i }));

    // Wait for form to load with existing content
    await waitFor(() => {
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument(); // Language badge
      const contentInput = screen.getByLabelText(/cv content/i);
      expect(contentInput).toHaveValue(mockDetailedCVs[0].content);
    });

    // Update content
    const contentInput = screen.getByLabelText(/cv content/i);
    await user.clear(contentInput);
    await user.type(contentInput, updatedCV.content);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    // Verify redirect and update
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Detailed CVs' }),
      ).toBeInTheDocument();
      const cvContent = screen.getByText((content) =>
        content.includes('Updated English CV'),
      );
      expect(cvContent).toBeInTheDocument();
    });
  });

  test('should delete an existing CV with confirmation', async () => {
    const user = userEvent.setup();

    // Start on detail page of French CV
    await renderWithAuth([ROUTES.DETAILED_CVS.DETAIL('fr')]);

    // Wait for CV content and delete button
    await waitFor(() => {
      expect(screen.getByText('FR')).toBeInTheDocument(); // Language badge
      expect(
        screen.getByRole('button', { name: /delete cv/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes('CV Français')),
      ).toBeInTheDocument();
    });

    // Click delete button
    await user.click(
      screen.getByRole('button', { name: /delete detailed cv/i }),
    );

    // Verify confirmation dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to delete this cv?/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^delete$/i }),
      ).toBeInTheDocument();
    });

    // Setup handlers for successful delete
    addIntegrationHandlers([
      createGetHandler('/user/detailed-cvs', 'DetailedCVResponse', [
        mockDetailedCVs[0], // Only English CV remains
      ]),
    ]);

    // Click delete button in dialog
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    // Verify redirect and list update
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Detailed CVs' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText((content) => content.includes('CV Français')),
      ).not.toBeInTheDocument();
    });
  });

  test('should cancel CV deletion', async () => {
    const user = userEvent.setup();

    // Start on detail page of French CV
    await renderWithAuth([ROUTES.DETAILED_CVS.DETAIL('fr')]);

    // Click delete button
    await user.click(screen.getByRole('button', { name: /delete cv/i }));

    // Click cancel in confirmation dialog
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Verify dialog closes and CV still exists
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('FR')).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes('CV Français')),
      ).toBeInTheDocument();
    });
  });
});
