import { Button } from '@headlessui/react';
import { DetailedCVCard } from './DetailedCVCard';
import {
  useDetailedCVs,
  getAvailableLanguages,
} from '../../hooks/useDetailedCVs';
import { LanguageCode } from '../../../../lib/language/types';
import type { ApiError } from '../../../../lib/api/client';

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  [LanguageCode.ENGLISH]: 'English',
  [LanguageCode.FRENCH]: 'French',
  [LanguageCode.GERMAN]: 'German',
  [LanguageCode.SPANISH]: 'Spanish',
  [LanguageCode.ITALIAN]: 'Italian',
};

interface DetailedCVListProps {
  onCVSelect: (languageCode: LanguageCode) => void;
  onCreateCV: (languageCode: LanguageCode) => void;
}

export function DetailedCVList({
  onCVSelect,
  onCreateCV,
}: DetailedCVListProps) {
  const { data: cvs = [], isLoading, error } = useDetailedCVs();

  const availableLanguages = getAvailableLanguages(cvs);

  if (error) {
    const errorMessage =
      (error as ApiError).message ?? 'Failed to load detailed CVs';
    return (
      <div className="text-center py-8">
        <p className="text-error">{errorMessage}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <span
          role="status"
          className="loading loading-spinner loading-lg"
        ></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cvs.map((cv) => (
          <DetailedCVCard
            key={cv.id}
            cv={cv}
            onClick={() => onCVSelect(cv.language_code as LanguageCode)}
          />
        ))}

        {/* Create buttons for available languages */}
        {availableLanguages.map((languageCode) => (
          <div key={languageCode} className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">{LANGUAGE_NAMES[languageCode]}</h2>
              <p className="text-base-content/70">
                No detailed CV for this language
              </p>
              <div className="card-actions justify-end mt-4">
                <Button
                  className="btn btn-primary"
                  onClick={() => onCreateCV(languageCode)}
                >
                  Create Detailed CV ({LANGUAGE_NAMES[languageCode]})
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
