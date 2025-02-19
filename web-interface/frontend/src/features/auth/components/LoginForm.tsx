import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, Input, Label, Description, Button } from '@headlessui/react';
import { useAuth } from '../auth-context';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { loginWithCredentials } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginWithCredentials(data);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the login function
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Field>
        <Label className="text-sm font-medium text-gray-700">Email</Label>
        <Input
          type="email"
          autoComplete="email"
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
          {...register('password')}
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary"
        />
        {errors.password && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.password.message}
          </Description>
        )}
      </Field>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full data-[hover]:btn-primary-focus data-[disabled]:btn-disabled"
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
