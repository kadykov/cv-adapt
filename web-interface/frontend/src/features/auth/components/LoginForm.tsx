import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, Input, Label, Description, Button } from '@headlessui/react';
import { useLoginMutation } from '../hooks';
import { ApiError } from '../../../lib/api/client';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

/**
 * Login form component that uses React Query mutation for authentication.
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { mutate: login, error: apiError, isPending } = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
  });

  const onSubmit = handleSubmit((data) => {
    login(
      { email: data.email, password: data.password },
      { onSuccess: onSuccess },
    );
  });

  const getErrorMessage = () => {
    if (!apiError) return null;

    if (apiError instanceof ApiError) {
      if (apiError.message.includes('Invalid credentials')) {
        return 'Invalid credentials';
      }
      return apiError.message;
    }

    return 'An unexpected error occurred';
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Field>
        <Label className="text-sm font-medium text-gray-700">Email</Label>
        <Input
          type="email"
          autoComplete="email"
          disabled={isPending}
          data-testid="email-input"
          {...register('email')}
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary"
        />
        {errors.email && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.email.message}
          </Description>
        )}
      </Field>

      <Field>
        <Label className="text-sm font-medium text-gray-700">Password</Label>
        <Input
          type="password"
          autoComplete="current-password"
          disabled={isPending}
          data-testid="password-input"
          {...register('password')}
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary"
        />
        {errors.password && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.password.message}
          </Description>
        )}
      </Field>

      {apiError && (
        <Field>
          <Description className="text-sm text-error" role="alert">
            {getErrorMessage()}
          </Description>
        </Field>
      )}

      <Button
        type="submit"
        disabled={isPending}
        data-testid="submit-button"
        className="btn btn-primary w-full data-[hover]:btn-primary-focus data-[disabled]:btn-disabled"
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
