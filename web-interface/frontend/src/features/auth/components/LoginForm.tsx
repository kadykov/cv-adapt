import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, Input, Label, Description, Button } from '@headlessui/react';
import { useLoginMutation } from '../hooks';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { mutateAsync, error, isPending } = useLoginMutation();
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

  const onSubmit = async (data: LoginFormData) => {
    try {
      await mutateAsync(data);
      onSuccess?.();
    } catch {
      // Error is handled by the mutation error state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Field>
        <Label className="text-sm font-medium text-gray-700">Email</Label>
        <Input
          type="email"
          autoComplete="email"
          disabled={isPending}
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
          {...register('password')}
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary"
        />
        {errors.password && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.password.message}
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
        {isPending ? 'Signing in' : 'Sign in'}
      </Button>
    </form>
  );
}
