import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Label, Description, Button } from '@headlessui/react';
import { useJobMutations } from '../../hooks/useJobMutations';
import { jobFormSchema, type JobFormData } from './jobFormSchema';

interface JobFormProps {
  mode: 'create' | 'edit';
  jobId?: number;
  initialData?: Partial<JobFormData>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function JobForm({
  mode,
  jobId,
  initialData,
  onSuccess,
  onCancel,
}: JobFormProps) {
  const { createJob, updateJob } = useJobMutations();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    delayError: 0,
    criteriaMode: 'all',
    defaultValues: initialData,
  });

  const onSubmit = handleSubmit(async (data: JobFormData) => {
    // Reset any previous root errors
    setError('root', { type: 'custom', message: '' });
    try {
      if (mode === 'edit' && jobId) {
        await updateJob.mutateAsync({ id: jobId, data });
      } else {
        await createJob.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      console.error('Form submission failed:', error);
      // Set a form-level error
      setError('root', {
        type: 'custom',
        message: 'Failed to submit form. Please try again.',
      });
      return false; // Prevent form submission
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {errors.root && (
        <div role="alert" className="text-sm text-error mb-4">
          {errors.root.message}
        </div>
      )}
      <Field>
        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
          Title
        </Label>
        <Input
          type="text"
          id="title"
          {...register('title')}
          aria-required="true"
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary"
        />
        {errors.title && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.title.message}
          </Description>
        )}
      </Field>

      <Field>
        <Label
          htmlFor="description"
          className="text-sm font-medium text-gray-700"
        >
          Description
        </Label>
        <textarea
          id="description"
          {...register('description')}
          aria-required="true"
          className="textarea textarea-bordered w-full data-[hover]:textarea-primary data-[focus]:textarea-primary"
          rows={4}
        />
        {errors.description && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.description.message}
          </Description>
        )}
      </Field>

      <Field>
        <Label
          htmlFor="language_code"
          className="text-sm font-medium text-gray-700"
        >
          Language Code
        </Label>
        <Input
          type="text"
          id="language_code"
          {...register('language_code')}
          aria-required="true"
          className="input input-bordered w-full data-[hover]:input-primary data-[focus]:input-primary"
        />
        {errors.language_code && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.language_code.message}
          </Description>
        )}
      </Field>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary data-[hover]:btn-primary-focus data-[disabled]:btn-disabled"
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Job'
              : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
