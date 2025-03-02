import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Label, Description, Button, Switch } from '@headlessui/react';
import { useDetailedCVMutations } from '../../hooks/useDetailedCVMutations';
import {
  detailedCVFormSchema,
  type DetailedCVFormData,
  type DetailedCVFormInput,
  type FormResolver,
} from './detailedCVFormSchema';
import { LanguageCode } from '../../../../lib/language/types';
import { mapApiToFormData } from '../../types/detailed-cv';
import type { DetailedCVResponse } from '../../types/detailed-cv';

interface DetailedCVFormProps {
  mode: 'create' | 'edit';
  languageCode: LanguageCode;
  initialData?: DetailedCVResponse;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DetailedCVForm({
  mode,
  languageCode,
  initialData,
  onSuccess,
  onCancel,
}: DetailedCVFormProps) {
  const { upsertCV } = useDetailedCVMutations();

  // Convert API response to form data if editing
  const formInitialData = initialData
    ? mapApiToFormData(initialData)
    : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
  } = useForm<DetailedCVFormInput>({
    resolver: zodResolver(detailedCVFormSchema) as FormResolver,
    mode: 'onChange',
    defaultValues: {
      content: formInitialData?.content || '',
      language_code: languageCode,
      is_primary: formInitialData?.is_primary || false,
    },
  });

  // Watch is_primary value for the switch
  const isPrimary = watch('is_primary');

  const onSubmit = handleSubmit(async (formData: DetailedCVFormInput) => {
    // Reset any previous root errors
    setError('root', { type: 'custom', message: '' });

    // We know the data is valid at this point due to schema validation
    const validData: DetailedCVFormData = {
      content: formData.content,
      language_code: languageCode,
      is_primary: formData.is_primary,
    };

    try {
      await upsertCV.mutateAsync({
        languageCode: validData.language_code,
        data: validData,
      });
      onSuccess();
    } catch (error) {
      console.error('Form submission failed:', error);
      setError('root', {
        type: 'custom',
        message: 'Failed to submit form. Please try again.',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate role="form">
      {errors.root && (
        <div role="alert" className="text-sm text-error mb-4">
          {errors.root.message}
        </div>
      )}

      <Field>
        <Label htmlFor="content" className="text-sm font-medium text-gray-700">
          CV Content (Markdown)
        </Label>
        <textarea
          id="content"
          {...register('content')}
          aria-required="true"
          className="textarea textarea-bordered w-full data-[hover]:textarea-primary data-[focus]:textarea-primary font-mono"
          rows={15}
          placeholder="# Your CV Content in Markdown format

## Experience
- **Company Name** | Position | Date - Date
  - Responsibility 1
  - Responsibility 2

## Education
- **University Name** | Degree | Date - Date

## Skills
- Skill 1
- Skill 2"
        />
        {errors.content && (
          <Description className="mt-1 text-sm text-error" role="alert">
            {errors.content.message}
          </Description>
        )}
      </Field>

      <Field>
        <div className="flex items-center">
          <Switch
            checked={isPrimary}
            onChange={(checked) => setValue('is_primary', checked)}
            className={`${
              isPrimary ? 'bg-primary' : 'bg-base-300'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
          >
            <span
              className={`${
                isPrimary ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
          <Label htmlFor="is_primary" className="ml-3 text-sm font-medium">
            Set as primary CV
          </Label>
        </div>
        <Description className="mt-1 text-xs text-base-content/70">
          The primary CV will be used when generating CVs for job applications
          if no CV in the job's language exists.
        </Description>
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
              ? 'Create CV'
              : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
