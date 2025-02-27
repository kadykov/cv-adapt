import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { ROUTES } from './paths';
import { Button } from '@headlessui/react';

type LocationState = {
  from?: string | { pathname: string };
};

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const from = (() => {
    const fromState = (location.state as LocationState)?.from;
    if (typeof fromState === 'string') {
      return fromState;
    }
    return fromState?.pathname || ROUTES.HOME;
  })();

  const onSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center mb-4">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>

          {isLogin ? (
            <LoginForm onSuccess={onSuccess} />
          ) : (
            <RegisterForm onSuccess={onSuccess} />
          )}

          <div className="divider">OR</div>

          <Button
            className="btn btn-ghost"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? 'Need an account? Sign up'
              : 'Already have an account? Sign in'}
          </Button>
        </div>
      </div>
    </div>
  );
}
