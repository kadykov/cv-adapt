import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Field, Input, Label, Description, Button } from '@headlessui/react';
import { useRegisterMutation } from '../hooks/index';
import type { RegisterRequest } from '../../../lib/api/generated-types';

const schema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  const { mutate: registerUser, error, isPending } = useRegisterMutation();

  const handleFormSubmit = handleSubmit((data: FormData) => {
    const variables: RegisterRequest = {
      email: data.email,
      password: data.password,
      personal_info: {},
    };
    registerUser(variables, {
      onSuccess: () => {
        reset(); // Clear form on success
        onSuccess();
      },
    });
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      <Field>
        <Label className="text-sm font-medium text-gray-700">Email</Label>
        <Input
          type="email"
          autoComplete="email"
          disabled={isPending}
          data-testid="email-input"
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
          data-testid="password-input"
          {...register('password')}
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary data-[disabled]:input-disabled"
        />
        {errors.password && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.password.message}
          </Description>
        )}
      </Field>

      <Field>
        <Label className="text-sm font-medium text-gray-700">
          Confirm Password
        </Label>
        <Input
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          data-testid="confirm-password-input"
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
        data-testid="submit-button"
        className="btn btn-primary w-full data-[hover]:btn-primary-focus data-[disabled]:btn-disabled"
      >
        {isPending ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
}
