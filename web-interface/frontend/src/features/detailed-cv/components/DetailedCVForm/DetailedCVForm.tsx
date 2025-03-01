import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Field,
  Label,
  Description,
  Button,
  Listbox,
  Switch,
} from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { getLanguageOptions } from '../../../../lib/language/config';
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
  languageCode?: LanguageCode;
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
  const languages = getLanguageOptions();

  // Convert API response to form data if editing
  const formInitialData = initialData
    ? mapApiToFormData(initialData)
    : undefined;

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(
    languageCode || formInitialData?.language_code || null,
  );

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
      language_code: selectedLanguage,
      is_primary: formInitialData?.is_primary || false,
    },
  });

  // Watch is_primary value for the switch
  const isPrimary = watch('is_primary');

  useEffect(() => {
    setValue('language_code', selectedLanguage);
  }, [selectedLanguage, setValue]);

  const onSubmit = handleSubmit(async (formData: DetailedCVFormInput) => {
    // Reset any previous root errors
    setError('root', { type: 'custom', message: '' });

    // We know the data is valid at this point due to schema validation
    const validData: DetailedCVFormData = {
      content: formData.content,
      language_code: formData.language_code!,
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
                  disabled={mode === 'edit'} // Disable language selection in edit mode
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
                {open && mode !== 'edit' && (
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
