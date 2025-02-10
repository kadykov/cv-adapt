import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../../../api/core/api-error';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    acceptTerms: '',
    general: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      acceptTerms: '',
      general: ''
    };

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters';
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password && !newErrors.acceptTerms;
  };
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setErrors({ email: '', password: '', acceptTerms: '', general: '' });
    setIsLoading(true);

    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(prev => ({ ...prev, general: err.message }));
      } else {
        setErrors(prev => ({ ...prev, general: 'Registration failed. Please try again.' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6" role="form">
        {errors.email && <div className="alert alert-error" role="alert">{errors.email}</div>}
        {errors.password && <div className="alert alert-error" role="alert">{errors.password}</div>}
        {errors.acceptTerms && <div className="alert alert-error" role="alert">{errors.acceptTerms}</div>}
        {errors.general && <div className="alert alert-error" role="alert">{errors.general}</div>}
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
          <label className="label">
            <span className="label-text-alt">
              Password must contain at least 8 characters including uppercase lowercase and numbers
            </span>
          </label>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer" htmlFor="acceptTerms">
            <span className="label-text">I accept the terms and conditions</span>
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              className="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
          </label>
        </div>
        <button
          type="submit"
          className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
