import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegisterMutation } from '../hooks';
import { useAuth } from '../context';
import type { RegisterRequest } from '../../../lib/api/types';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    criteriaMode: 'all',
  });

  const {
    mutateAsync,
    error,
    isPending,
  } = useRegisterMutation();

  const onSubmit = async (data: FormData) => {
    try {
      const variables: RegisterRequest = {
        email: data.email,
        password: data.password,
      };
      const response = await mutateAsync(variables);
      // Update auth context with the registration response
      login(response);
      reset(); // Clear form
      onSuccess();
    } catch {
      // Error is handled by the mutation error state
    }
  };

  // Determine all password validation errors
  const passwordValidationRules = [
    {
      id: 'minLength',
      message: 'Password must be at least 8 characters',
      test: (pw?: string) => pw && pw.length >= 8,
    },
    {
      id: 'uppercase',
      message: 'Password must contain at least one uppercase letter',
      test: (pw?: string) => pw && /[A-Z]/.test(pw),
    },
    {
      id: 'number',
      message: 'Password must contain at least one number',
      test: (pw?: string) => pw && /[0-9]/.test(pw),
    },
  ];

  const password = errors.password?.ref?.value;
  const passwordErrors = passwordValidationRules
    .filter(rule => !rule.test(password))
    .map(rule => rule.message);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          autoComplete="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={isPending}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={isPending}
        />
        {passwordErrors.map((error, index) => (
          <p key={index} className="mt-1 text-sm text-red-600" role="alert">{error}</p>
        ))}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          {...register('confirmPassword')}
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={isPending}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isPending ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
