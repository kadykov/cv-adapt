import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Field, Input, Label, Description, Button } from '@headlessui/react';
import { useRegisterMutation } from '../hooks';
import { useAuth } from '../context';
import type { RegisterRequest } from '../../../lib/api/generated-types';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Field>
        <Label className="text-sm font-medium text-gray-700">Email</Label>
        <Input
          type="email"
          autoComplete="email"
          disabled={isPending}
          {...register('email')}
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary data-[disabled]:input-disabled"
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
          autoComplete="new-password"
          disabled={isPending}
          {...register('password')}
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary data-[disabled]:input-disabled"
        />
        {passwordErrors.map((error, index) => (
          <Description key={index} className="mt-1 text-sm text-error" role="alert">
            {error}
          </Description>
        ))}
      </Field>

      <Field>
        <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
        <Input
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          {...register('confirmPassword')}
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary data-[disabled]:input-disabled"
        />
        {errors.confirmPassword && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.confirmPassword.message}
          </Description>
        )}
      </Field>

      {error && (
        <Field>
          <Description className="text-sm text-error" role="alert">
            {error.message}
          </Description>
        </Field>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="btn btn-primary w-full data-[hover]:btn-primary-focus data-[disabled]:btn-disabled"
      >
        {isPending ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
}
