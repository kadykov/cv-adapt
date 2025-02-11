import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../../../api/core/api-error';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, remember);
      window.location.href = '/jobs';
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ general: 'Invalid email or password' });
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6" aria-label="Login form">
        {errors.email && (
          <div className="alert alert-error" role="alert">
            {errors.email}
          </div>
        )}
        {errors.password && (
          <div className="alert alert-error" role="alert">
            {errors.password}
          </div>
        )}
        {errors.general && (
          <div className="alert alert-error" role="alert">
            {errors.general}
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
            />
          </label>
        </div>
        <button
          type="submit"
          className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
