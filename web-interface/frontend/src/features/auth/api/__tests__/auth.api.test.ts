import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "../auth.api";
import type { LoginCredentials } from "../../types";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("auth.api", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("login", () => {
    it("formats login request according to OAuth2 password flow requirements", async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: "test-token",
          user: { id: 1, email: "test@example.com" }
        })
      });

      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
        remember: true
      };

      await login(credentials);

      // Verify the request format
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      // Verify request URL
      expect(url).toMatch(/\/v1\/auth\/login$/);  // Should end with /v1/auth/login

      // Verify request headers
      expect(options.headers).toEqual({
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      });

      // Verify the body is properly formatted for OAuth2
      const formData = new URLSearchParams(options.body);
      expect(formData.get("username")).toBe(credentials.email); // email mapped to username
      expect(formData.get("password")).toBe(credentials.password);
      expect(formData.get("grant_type")).toBe("password"); // OAuth2 requirement
    });
  });
});
