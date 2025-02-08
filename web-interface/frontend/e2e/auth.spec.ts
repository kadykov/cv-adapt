import { test, expect, authTestUser } from './utils';

test.describe('Authentication', () => {
  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');

    // Fill the registration form
    await page.fill('input[type="email"]', authTestUser.email);
    await page.fill('input[type="password"]', authTestUser.password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard');

    // Verify user is logged in
    const localStorageData = await page.evaluate(() => localStorage.getItem('token'));
    expect(localStorageData).toBeTruthy();
  });

  test('should not register with existing email', async ({ page }) => {
    // First registration
    await page.goto('/register');
    await page.fill('input[type="email"]', authTestUser.email);
    await page.fill('input[type="password"]', authTestUser.password);
    await page.click('button[type="submit"]');

    // Try registering again with same email
    await page.goto('/register');
    await page.fill('input[type="email"]', authTestUser.email);
    await page.fill('input[type="password"]', 'differentpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('.alert-error');
    await expect(errorMessage).toContainText('Email already registered');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Register user first
    await page.goto('/register');
    await page.fill('input[type="email"]', authTestUser.email);
    await page.fill('input[type="password"]', authTestUser.password);
    await page.click('button[type="submit"]');

    // Logout
    await page.goto('/logout');

    // Try logging in
    await page.goto('/login');
    await page.fill('input[type="email"]', authTestUser.email);
    await page.fill('input[type="password"]', authTestUser.password);

    // Check remember me checkbox
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should not login with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill the login form with invalid credentials
    await page.fill('input[type="email"]', authTestUser.email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('.alert-error');
    await expect(errorMessage).toContainText('Incorrect email or password');

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should handle token refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', authTestUser.email);
    await page.fill('input[type="password"]', authTestUser.password);
    await page.click('button[type="submit"]');

    // Mock an expired token scenario
    await page.evaluate(() => {
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        if (typeof input === 'string' && input.includes('/v1/auth/refresh')) {
          return originalFetch(input, init);
        }
        const response = await originalFetch(input, init);
        if (response.status === 401) {
          // Token expired, should trigger refresh
          const refreshResponse = await originalFetch('/v1/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: localStorage.getItem('refreshToken'),
            }),
          });
          if (refreshResponse.ok) {
            const { access_token } = await refreshResponse.json();
            localStorage.setItem('token', access_token);
            return originalFetch(input, {
              ...init,
              headers: {
                ...init?.headers,
                Authorization: `Bearer ${access_token}`,
              },
            });
          }
        }
        return response;
      };
    });

    // Try accessing a protected route
    await page.goto('/dashboard');

    // Should still be on dashboard after token refresh
    await expect(page).toHaveURL('/dashboard');
  });
});
