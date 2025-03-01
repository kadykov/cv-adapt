import { describe, test, expect, vi } from 'vitest';
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
  createErrorHandler,
  addIntegrationHandlers,
} from '../../../../lib/test/integration';
import { prettyDOM } from '@testing-library/dom';
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

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  [LanguageCode.ENGLISH]: 'English',
  [LanguageCode.FRENCH]: 'French',
  [LanguageCode.GERMAN]: 'German',
  [LanguageCode.SPANISH]: 'Spanish',
  [LanguageCode.ITALIAN]: 'Italian',
};

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

  const serverError = {
    detail: { message: 'Internal Server Error' },
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
    // Wait for any pending effects
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const renderWithAuth = async (
    initialEntries: string[] = [ROUTES.DETAILED_CVS.LIST],
  ) => {
    // Mock authenticated state with tokens
    localStorage.setItem('access_token', 'valid-access-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());

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

  test('should list detailed CVs and available languages', async () => {
    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    // Wait for existing CVs to load
    await waitFor(() => {
      // Verify English CV is displayed
      expect(screen.getByText(/# English CV.+/)).toBeInTheDocument();
      expect(screen.getByText('en')).toBeInTheDocument();

      // Verify French CV is displayed
      expect(screen.getByText(/# CV Français.+/)).toBeInTheDocument();
      expect(screen.getByText('fr')).toBeInTheDocument();
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Verify available language options
    const availableLanguages = [
      LanguageCode.GERMAN,
      LanguageCode.ITALIAN,
      LanguageCode.SPANISH,
    ];
    for (const lang of availableLanguages) {
      try {
        // Find language heading with explicit waiting
        await waitFor(
          () => {
            expect(
              screen.getByRole('heading', { name: LANGUAGE_NAMES[lang] }),
            ).toBeInTheDocument();
          },
          { timeout: 5000 },
        );

        // Find create button with language name
        await waitFor(
          () => {
            expect(
              screen.getByRole('button', {
                name: new RegExp(
                  `Create Detailed CV \\(${LANGUAGE_NAMES[lang]}\\)`,
                  'i',
                ),
              }),
            ).toBeInTheDocument();
          },
          { timeout: 5000 },
        );

        // Find this language's card and verify its message
        const card = screen
          .getByRole('heading', { name: LANGUAGE_NAMES[lang] })
          .closest('.card') as HTMLElement;
        expect(card).toBeInTheDocument();
        expect(
          within(card!).getByText('No detailed CV for this language'),
        ).toBeInTheDocument();
      } catch (error) {
        console.error(`Failed with language ${lang}:`, error);
        console.log('Current DOM state:', prettyDOM(document.body));
        throw error;
      }
    }
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
    try {
      const user = userEvent.setup();
      await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

      // Wait for loading to complete and German heading to be visible
      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
          expect(
            screen.getByRole('heading', { name: 'German' }),
          ).toBeInTheDocument();
          expect(screen.getByRole('heading', { name: 'German' })).toBeVisible();
        },
        { timeout: 5000 },
      );

      // Find and click the German language card's create button
      const germanCard = screen
        .getByRole('heading', { name: 'German' })
        .closest('.card') as HTMLElement;
      const createButton = within(germanCard!).getByRole('button', {
        name: /create detailed cv/i,
      });
      await user.click(createButton);

      // Wait for create form to be rendered
      await waitFor(() => {
        expect(screen.getByText('Create Detailed CV')).toBeInTheDocument();
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
      });

      // Select language from dropdown
      // Get the language selector by its label and select German
      const languageLabel = screen.getByText('Language');
      const languageSelect =
        languageLabel.parentElement?.querySelector('button');
      expect(languageSelect).toBeInTheDocument();
      await user.click(languageSelect!);

      // Wait for dropdown to appear and select German
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: 'German (Deutsch)' }),
        ).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('option', { name: 'German (Deutsch)' }),
      );

      // Fill in content
      const contentInput = screen.getByLabelText(/cv content/i);
      await user.type(contentInput, mockNewCV.content);

      // Update handlers to include new CV in list response after creation
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

      // Wait for form to disappear and navigation to complete
      await waitFor(
        () => {
          expect(screen.queryByRole('form')).not.toBeInTheDocument();
          expect(
            screen.getByRole('heading', { name: 'Detailed CVs' }),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // First check that German card is no longer showing "No detailed CV"
      await waitFor(
        () => {
          const germanCard = screen.queryByText(
            'No detailed CV for this language',
          );
          expect(germanCard).not.toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Wait for the new CV content to appear with a more precise selector
      await waitFor(
        () => {
          const paragraphs = screen.getAllByText((content) => {
            return (
              content.includes('Deutscher Lebenslauf') &&
              content.includes('auf Deutsch')
            );
          });
          expect(paragraphs.length).toBeGreaterThan(0);

          const cvCard = paragraphs[0].closest('.card');
          expect(cvCard).toBeInTheDocument();
          expect(
            within(cvCard as HTMLElement).getByText('de'),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    } catch (error) {
      console.error('Test failed:', error);
      console.log('Current DOM state:', prettyDOM(document.body));
      throw error;
    }
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

    // Verify the French CV is marked as primary in the list view
    await waitFor(
      () => {
        // Find all CV cards
        const cvCards = screen.getAllByRole('button');

        // Find the French CV card
        const frenchCard = cvCards.find((card) =>
          card.textContent?.includes('# CV Français'),
        );
        expect(frenchCard).toBeInTheDocument();

        // Check for primary badge
        const primaryBadge = frenchCard?.querySelector('[class*="bg-primary"]');
        expect(primaryBadge).toBeInTheDocument();
        expect(primaryBadge).toHaveTextContent('Primary');

        // Verify English CV is no longer primary
        const englishCard = cvCards.find((card) =>
          card.textContent?.includes('# English CV'),
        );
        expect(englishCard).toBeInTheDocument();
        expect(
          englishCard?.querySelector('[class*="bg-primary"]'),
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 },
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
      expect(
        screen.getByRole('heading', { level: 1, name: 'Detailed CVs' }),
      ).toBeInTheDocument();
    });

    // Verify the French CV is no longer in the list and shows as available
    await waitFor(() => {
      expect(screen.queryByText(/CV Français/)).not.toBeInTheDocument();
      expect(screen.queryByText('fr')).not.toBeInTheDocument();

      // Should now show the French language as available
      const frenchCard = screen.getByText('French');
      expect(frenchCard).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create detailed cv.*french/i }),
      ).toBeInTheDocument();
    });

    // Restore original window.confirm
    window.confirm = originalConfirm;
  });

  test('should handle form validation errors', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'German' }),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Click create button for German CV
    const germanCard = screen
      .getByRole('heading', { name: 'German' })
      .closest('.card') as HTMLElement;
    const createButton = within(germanCard!).getByRole('button', {
      name: /create detailed cv/i,
    });
    await user.click(createButton);

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create cv/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/content is required/i)).toBeInTheDocument();
    });
  });

  test('should navigate between list and detail pages', async () => {
    const user = userEvent.setup();
    await renderWithAuth([ROUTES.DETAILED_CVS.LIST]);

    // Wait for CVs to load
    await waitFor(() => {
      expect(screen.getByText(/# English CV/)).toBeInTheDocument();
    });

    // Find and click the English CV card
    const cvCard = screen.getByRole('button', { name: /english cv/i });
    await user.click(cvCard);

    // Should see the detail page
    await waitFor(() => {
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: 'English CV' }),
      ).toBeInTheDocument();
    });

    // Go back to list page
    const backLink = screen.getByRole('link', { name: /back to list/i });
    await user.click(backLink);

    // Wait for list content
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Detailed CVs' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/# English CV/)).toBeInTheDocument();
    });
  });

  test('should update an existing CV', async () => {
    const user = userEvent.setup();

    const updatedCV = {
      ...mockDetailedCVs[0],
      content: '# Updated English CV\n\nThis is my updated English CV content.',
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
      { timeout: 5000 },
    );
  });
});
