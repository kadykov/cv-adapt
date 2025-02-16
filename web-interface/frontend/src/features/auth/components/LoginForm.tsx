import { useState, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '../../../api/auth';

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const { mutate: login, isPending } = useMutation({
    mutationKey: ['login'],
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        setError(null);
        const authService = new AuthService();
        return await authService.login(credentials);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      if (remember) {
        localStorage.setItem('remember', 'true');
      }
      navigate('/dashboard');
    },
    onError: (err: any) => {
      console.error('Login failed:', err);
      // Extract error message from response or use default
      const errorMessage = err.response?.data?.message
        || err.response?.statusText
        || err.message
        || 'An error occurred';
      setError(errorMessage);
    },
  });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check for empty required fields first
    if (!email || !password) {
      setError('Constraints not satisfied');
      return;
    }

    // Validate email format before API call
    if (!validateEmail(email)) {
      setError('Invalid email address');
      return;
    }

    // Call mutation with credentials
    login({ username: email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

        {/* Status announcements */}
        <div
          ref={statusRef}
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {isPending ? 'Logging in...' : error ? error : 'Form loaded'}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          aria-label="Login form"
          noValidate
        >
          {error && (
            <div
              className="alert alert-error"
              role="alert"
              aria-atomic="true"
            >
              {error}
            </div>
          )}
          <div className="form-control w-full">
            <label className="label" htmlFor="email">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isPending}
            />
          </div>
          <div className="form-control w-full">
            <label className="label" htmlFor="password">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isPending}
            />
          </div>
          <div className="form-control">
            <label className="label cursor-pointer" htmlFor="remember">
              <span className="label-text">Remember me</span>
              <input
                type="checkbox"
                id="remember"
                name="remember"
                className="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={isPending}
              />
            </label>
          </div>
          <button
            type="submit"
            className={`btn btn-primary w-full`}
            disabled={isPending}
            aria-busy={isPending}
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-2">
              {isPending ? (
                <>
                  <span className="loading loading-spinner" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}
