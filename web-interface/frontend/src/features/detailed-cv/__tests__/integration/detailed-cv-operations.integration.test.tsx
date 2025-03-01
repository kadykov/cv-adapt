import { describe, test, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import type { RenderOptions } from '@testing-library/react';
import {
  render,
  screen,
  waitFor,
  createGetHandler,
  createPutHandler,
  createDeleteHandler,
  createEmptyPutHandler,
  createErrorHandler,
  addIntegrationHandlers,
} from '../../../../lib/test/integration';
import type { ReactNode } from 'react';
import {
  DetailedCVListPage,
  CreateDetailedCVPage,
  EditDetailedCVPage,
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
      content:
        '# English CV\n\nThis is my English CV content.' as unknown as Record<
          string,
          never
        >,
      is_primary: true,
      created_at: '2024-02-17T12:00:00Z',
      updated_at: null,
    },
    {
      id: 2,
      user_id: 1,
      language_code: 'fr',
      content:
        '# CV Français\n\nVoici le contenu de mon CV en français.' as unknown as Record<
          string,
          never
        >,
      is_primary: false,
      created_at: '2024-02-17T12:00:00Z',
      updated_at: null,
    },
  ];

  const mockNewCV = {
    language_code: LanguageCode.GERMAN,
    content:
      '# Deutscher Lebenslauf\n\nDies ist mein Lebenslauf auf Deutsch.' as unknown as Record<
        string,
        never
      >,
    is_primary: false,
  };

  const serverError = {
    detail: { message: 'Internal Server Error' },
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderWithAuth = async (
    initialEntries: string[] = [ROUTES.DETAILED_CVS.LIST],
  ) => {
    // Mock authenticated state with tokens
    localStorage.setItem('access_token', 'valid-access-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: Infinity,
        },
      },
    });

    // Setup auth state before rendering
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
              path={ROUTES.DETAILED_CVS.CREATE}
              element={<CreateDetailedCVPage />}
            />
            <Route
              path={ROUTES.DETAILED_CVS.EDIT(':languageCode')}
              element={<EditDetailedCVPage />}
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

    // Wait for initial query to complete
    await queryClient.resetQueries();

    // Wait for auth state to be initialized
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    return wrapper;
  };

  // Add auth and detailed CV operation handlers
  beforeEach(() => {
    localStorage.clear();
    // Reset handlers before each test
    addIntegrationHandlers([
      // Include auth handlers from auth integration tests
      ...authIntegrationHandlers,
      // List detailed CVs - returns array
      createGetHandler(
        '/user/detailed-cvs',
        'DetailedCVResponse',
        mockDetailedCVs,
      ),
      // Get single detailed CVs - return single items
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
      createGetHandler('/user/detailed-cvs/de', 'DetailedCVResponse', {
        id: 3,
        user_id: 1,
        created_at: '2024-02-17T12:00:00Z',
        updated_at: null,
        ...mockNewCV,
      }),
      // Upsert CV - always PUT according to OpenAPI schema
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
      // Set primary CV - PUT with no request body
      createEmptyPutHandler(
        '/user/detailed-cvs/fr/primary',
        'DetailedCVResponse',
        {
          ...mockDetailedCVs[1],
          is_primary: true,
          updated_at: '2024-02-17T13:00:00Z',
        },
      ),
      // Delete CV - returns 204 No Content
      createDeleteHandler('/user/detailed-cvs/fr'),
    ]);
  });

  test('should list detailed CVs with language filtering', async () => {
    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    // Wait for CVs to load
    // Wait for English CV to load
    await waitFor(() => {
      expect(screen.getByText(/# English CV.+/)).toBeInTheDocument();
    });

    // Check English language badge
    expect(screen.getByText('en')).toBeInTheDocument();

    // Find the language selector button and click it
    const languageButton = screen.getByRole('button', { expanded: false });
    await userEvent.click(languageButton);

    // Find the French option and click it
    const frenchOption = screen.getByText('French');
    await userEvent.click(frenchOption);

    // Wait for French CV to load
    await waitFor(() => {
      expect(screen.getByText(/# CV Français.+/)).toBeInTheDocument();
    });

    // Check French language badge
    expect(screen.getByText('fr')).toBeInTheDocument();
  });

  test('should display loading and error states', async () => {
    // Add custom error handler for 500 response
    addIntegrationHandlers([
      createErrorHandler('/user/detailed-cvs', 500, serverError),
    ]);

    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    // Should show loading spinner initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Should show error state with specific message
    await waitFor(() => {
      expect(screen.getByText(serverError.detail.message)).toBeInTheDocument();
    });
  });

  test('should create a new detailed CV', async () => {
    const user = userEvent.setup();

    // Create test wrapper with create page route
    await renderWithAuth([ROUTES.DETAILED_CVS.CREATE]);

    // Wait for create page UI to be rendered
    await waitFor(() => {
      expect(screen.getByText('Create Detailed CV')).toBeInTheDocument();
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    // Fill in the form
    // Open language dropdown and select 'de'
    const languageButton = screen.getByRole('button', { name: /language/i });
    await user.click(languageButton);
    await user.click(screen.getByText('German (Deutsch)'));

    // Fill in content
    await user.type(
      screen.getByLabelText(/cv content/i),
      mockNewCV.content as unknown as string,
    );

    // Get the submit button before click
    const submitButton = screen.getByRole('button', { name: /create cv/i });

    // Submit form and capture the promise for checking state
    const submitPromise = user.click(submitButton);

    // Check submitting state right after click
    await waitFor(
      () => {
        const button = screen.getByRole('button', { name: /creating\.\.\./i });
        expect(button).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Wait for the click to complete
    await submitPromise;

    // Wait for submission success and view update
    await waitFor(
      () => {
        // Should no longer see the create form
        expect(screen.queryByRole('form')).not.toBeInTheDocument();

        // Should be on list page
        // Check for specific heading with role and text
        expect(
          screen.getByRole('heading', { name: 'Detailed CVs', level: 1 }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: /add cv/i }),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  test('should navigate from list to detail and edit pages', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    // Wait for CVs to load
    await waitFor(() => {
      // Use getAllByText to handle multiple matching elements
      const elements = screen.getAllByText((_content, element) => {
        return element?.textContent?.includes('# English CV') || false;
      });
      expect(elements.length).toBeGreaterThan(0);
    });

    // Find the CV card by its content and click it
    // Get all matching elements and find the one inside a button
    const elements = screen.getAllByText((_content, element) => {
      return element?.textContent?.includes('# English CV') || false;
    });

    // Find the element that's inside a card with role="button"
    const cvElement = elements.find(
      (element) => element.closest('[role="button"]') !== null,
    );

    // Get the card element
    const cvCard = cvElement?.closest('[role="button"]');
    expect(cvCard).toBeInTheDocument();

    // Click on the CV card
    await user.click(cvCard!);

    // Check if navigation occurred by looking for elements that should be present on the detail page
    await waitFor(() => {
      // Look for the article role which should be present on the detail page
      expect(screen.getByRole('article')).toBeInTheDocument();

      // Look for the rendered markdown content
      expect(
        screen.getByRole('heading', { level: 1, name: 'English CV' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('This is my English CV content.'),
      ).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Should see the edit form
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save changes/i }),
      ).toBeInTheDocument();
    });
  });

  test('should set a CV as primary', async () => {
    const user = userEvent.setup();

    // Override handlers for this test
    addIntegrationHandlers([
      // After setting primary, list should return updated data
      createGetHandler('/user/detailed-cvs', 'DetailedCVResponse', [
        { ...mockDetailedCVs[0], is_primary: false },
        { ...mockDetailedCVs[1], is_primary: true },
      ]),
    ]);

    await renderWithAuth([ROUTES.DETAILED_CVS.DETAIL('fr')]);

    // Wait for CV details to load
    await waitFor(() => {
      // Check for the heading in the rendered markdown
      expect(
        screen.getByRole('heading', { level: 1, name: 'CV Français' }),
      ).toBeInTheDocument();
    });

    // Click "Set as Primary" button
    await user.click(screen.getByRole('button', { name: /set as primary/i }));

    // After setting primary, we should be redirected to list page
    await waitFor(() => {
      // Should see list page heading
      const heading = screen.getByRole('heading', {
        level: 1,
        name: 'Detailed CVs',
      });
      expect(heading).toBeInTheDocument();
    });

    // Select French from the language filter
    // Wait for CVs to load and language selector to be available
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Find and click the language button using headlessui's listbox button
    const listbox = screen.getByRole('button', { name: 'English' });
    await user.click(listbox);

    // Find and click the French option in the dropdown
    const frenchOption = screen.getByRole('option', { name: 'French' });
    await user.click(frenchOption);

    // Wait for the French CV card to be rendered and check for primary status
    await waitFor(
      () => {
        // Find the French CV card by its language badge
        const frBadge = screen.getByText('fr');
        expect(frBadge).toBeInTheDocument();

        // Get the card containing the badge
        const frCard = frBadge.closest('[role="button"]');
        expect(frCard).toBeInTheDocument();

        // Find primary badge within the card
        const primaryBadge = frCard?.querySelector(
          '.bg-primary.text-primary-content',
        );
        expect(primaryBadge).toBeInTheDocument();
        expect(primaryBadge).toHaveTextContent('Primary');
      },
      { timeout: 3000 },
    );
  });

  test('should delete a CV and redirect to list', async () => {
    // Override handlers for delete test
    addIntegrationHandlers([
      // After delete, list should return CVs without the deleted one
      createGetHandler(
        '/user/detailed-cvs',
        'DetailedCVResponse',
        mockDetailedCVs.filter((cv) => cv.language_code !== 'fr'),
      ),
      // Individual CV endpoint - returns single item
      createGetHandler(
        '/user/detailed-cvs/fr',
        'DetailedCVResponse',
        mockDetailedCVs[1],
      ),
    ]);

    const user = userEvent.setup();
    await renderWithAuth([ROUTES.DETAILED_CVS.DETAIL('fr')]);

    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    // Wait for CV details to load
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'CV Français' }),
      ).toBeInTheDocument();
    });

    // Click delete button
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // Form should disappear on success
    await waitFor(() => {
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    });

    // Verify navigation by checking for elements that are only present on the list page
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add cv/i })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: 'Detailed CVs' }),
      ).toBeInTheDocument();
    });

    // Select French from the language filter to verify the CV is truly gone
    // Wait for CVs to load and language selector to be available
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Find and click the language button by its content
    const languageButton = screen.getByText('English');
    await user.click(languageButton);

    // Find and click the French option in the dropdown
    const frenchOption = screen.getByRole('option', { name: 'French' });
    await user.click(frenchOption);

    // Should not see deleted CV content
    await waitFor(
      () => {
        expect(screen.queryByText(/CV Français/)).not.toBeInTheDocument();
        // Should not see French language badge either
        expect(screen.queryByText('fr')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Restore original window.confirm
    window.confirm = originalConfirm;
  });

  test('should handle form validation errors', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.DETAILED_CVS.CREATE]);

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create cv/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/please select a valid language/i),
      ).toBeInTheDocument();
    });
  });

  test('should navigate between list and create pages', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    // Wait for CVs to load
    await waitFor(() => {
      // Use getAllByText to handle multiple matching elements
      const elements = screen.getAllByText((_content, element) => {
        return element?.textContent?.includes('# English CV') || false;
      });
      expect(elements.length).toBeGreaterThan(0);
    });

    // Find the "Add CV" link by role and click it
    const addCVButton = screen.getByRole('link', { name: /add cv/i });
    expect(addCVButton).toBeInTheDocument();
    await user.click(addCVButton);

    // Should see the create CV form
    await waitFor(() => {
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create cv/i }),
      ).toBeInTheDocument();
    });

    // Find the back link by exact text and role
    const backLinks = screen.getAllByText((_content, element) => {
      return element?.textContent?.includes('← Back to List') || false;
    });
    const backLink = backLinks.find(
      (element) => element.closest('a') !== null, // Find the one that's inside an anchor tag
    );
    expect(backLink).toBeInTheDocument();

    // Go back to CV list by clicking the link
    await user.click(backLink!);

    // Wait for list page content with careful verification
    await waitFor(() => {
      // Check for list-specific elements
      expect(screen.getByRole('link', { name: /add cv/i })).toBeInTheDocument();

      // Check for CV content using the same getAllByText approach
      const elements = screen.getAllByText((_content, element) => {
        return element?.textContent?.includes('# English CV') || false;
      });
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  test('should update an existing CV', async () => {
    const user = userEvent.setup();

    const updatedCV = {
      ...mockDetailedCVs[0],
      content:
        '# Updated English CV\n\nThis is my updated English CV content.' as unknown as Record<
          string,
          never
        >,
      updated_at: '2024-02-17T13:00:00Z',
    };

    // Override handlers for this test
    addIntegrationHandlers([
      // Update CV handler - returns single item
      createPutHandler(
        '/user/detailed-cvs/en',
        'DetailedCVCreate',
        'DetailedCVResponse',
        updatedCV,
      ),
      // After update, list should return array
      createGetHandler('/user/detailed-cvs', 'DetailedCVResponse', [
        updatedCV,
        mockDetailedCVs[1],
      ]),
    ]);

    await renderWithAuth([ROUTES.DETAILED_CVS.EDIT('en')]);

    // Wait for form to be loaded and pre-filled
    await waitFor(() => {
      // Check specific form elements
      expect(screen.getByRole('form')).toBeInTheDocument();
      const contentInput = screen.getByLabelText(/cv content/i);
      expect(contentInput).toBeInTheDocument();
      expect(contentInput).toHaveValue(
        '# English CV\n\nThis is my English CV content.',
      );
    });

    // Get form elements
    const contentInput = screen.getByLabelText(/cv content/i);
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    expect(submitButton).toBeInTheDocument();

    // Update content
    await user.clear(contentInput);
    await user.type(
      contentInput,
      '# Updated English CV\n\nThis is my updated English CV content.',
    );

    // Submit form
    await user.click(submitButton);

    // Verify redirect and updated content
    await waitFor(() => {
      // Verify we're on the list page
      expect(screen.getByRole('link', { name: /add cv/i })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: 'Detailed CVs' }),
      ).toBeInTheDocument();
    });

    // Wait for updated CV content to be visible
    await waitFor(
      () => {
        // In the list view, the CV content is shown in a preview with a line-clamp
        expect(screen.getByText(/# Updated English CV.+/)).toBeInTheDocument();
        expect(
          screen.getByText(/This is my updated English CV content\./),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
