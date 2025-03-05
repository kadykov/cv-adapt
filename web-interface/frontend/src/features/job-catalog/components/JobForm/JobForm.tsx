import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Field,
  Input,
  Label,
  Description,
  Button,
  Listbox,
} from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { getLanguageOptions } from '@/lib/language/config';
import { useJobMutations } from '../../hooks/useJobMutations';
import {
  jobFormSchema,
  type JobFormData,
  type JobFormInput,
  type FormResolver,
} from './jobFormSchema';
import { LanguageCode } from '@/lib/language/types';

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
  const languages = getLanguageOptions();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(
    initialData?.language_code ?? null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<JobFormInput>({
    resolver: zodResolver(jobFormSchema) as FormResolver,
    mode: 'onChange',
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      language_code: initialData?.language_code ?? null,
    },
  });

  useEffect(() => {
    setValue('language_code', selectedLanguage);
  }, [selectedLanguage, setValue]);

  const onSubmit = handleSubmit(async (formData: JobFormInput) => {
    // Reset any previous root errors
    setError('root', { type: 'custom', message: '' });

    // We know the data is valid at this point due to schema validation
    const validData: JobFormData = {
      title: formData.title,
      description: formData.description,
      language_code: formData.language_code!,
    };

    try {
      if (mode === 'edit' && jobId) {
        await updateJob.mutateAsync({ id: jobId, data: validData });
      } else {
        await createJob.mutateAsync(validData);
      }
      onSuccess();
    } catch (error) {
      console.error('Form submission failed:', error);
      // Use server error message if available, or fallback to generic message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to submit form. Please try again.';

      setError('root', {
        type: 'custom',
        message: errorMessage,
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
        <Listbox value={selectedLanguage} onChange={setSelectedLanguage}>
          {({ open }) => (
            <div className="relative">
              <Listbox.Label className="text-sm font-medium text-gray-700">
                Language
              </Listbox.Label>
              <div className="relative mt-1">
                <Listbox.Button
                  aria-required="true"
                  className="relative w-full select input input-bordered data-[hover]:input-primary data-[focus]:input-primary"
                >
                  <span className="block truncate">
                    {selectedLanguage
                      ? languages.find((opt) => opt.value === selectedLanguage)
                          ?.label
                      : 'Select language'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                {open && (
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-base-100 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {languages.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active }) =>
                          `relative select-none py-2 pl-10 pr-4 ${
                            active
                              ? 'bg-primary text-primary-content'
                              : 'text-base-content'
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                            >
                              {option.label}
                            </span>
                            {selected && (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active
                                    ? 'text-primary-content'
                                    : 'text-primary'
                                }`}
                              >
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                )}
              </div>
              {errors.language_code && (
                <Description className="mt-1 text-sm text-error" role="alert">
                  {errors.language_code.message}
                </Description>
              )}
            </div>
          )}
        </Listbox>
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
