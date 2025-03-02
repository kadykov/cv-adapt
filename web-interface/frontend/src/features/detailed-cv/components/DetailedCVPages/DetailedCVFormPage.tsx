import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDetailedCV } from '../../hooks/useDetailedCVs';
import { DetailedCVForm } from '../DetailedCVForm/DetailedCVForm';
import { ROUTES } from '../../../../routes/paths';
import { LanguageCode } from '../../../../lib/language/types';
import { getLanguageConfig } from '../../../../lib/language/config';
import { Badge } from '../../../../lib/components/Badge';

interface ApiError {
  status: number;
  message: string;
}

export function DetailedCVFormPage() {
  const navigate = useNavigate();
  const { languageCode } = useParams<{ languageCode: LanguageCode }>();
  const validLanguageCode =
    languageCode &&
    Object.values(LanguageCode).includes(languageCode as LanguageCode)
      ? (languageCode as LanguageCode)
      : undefined;

  const { data: cv, isLoading, error } = useDetailedCV(validLanguageCode);

  // Early return if invalid language code
  if (!validLanguageCode) {
    navigate(ROUTES.DETAILED_CVS.LIST);
    return null;
  }

  // Get language name - safe to access since we validated the code
  const languageName = getLanguageConfig(validLanguageCode).name;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <span className="loading loading-spinner loading-lg" role="status" />
      </div>
    );
  }

  // Handle errors, but treat 404 as a valid "create new CV" state
  if (error) {
    const apiError = error as unknown as ApiError;
    if (apiError?.status && apiError.status !== 404) {
      // Only show error for non-404 API errors
      return (
        <div role="alert" className="alert alert-error">
          <span>An unexpected error occurred. Please try again.</span>
        </div>
      );
    }
  }

  const handleSuccess = () => {
    navigate(ROUTES.DETAILED_CVS.LIST);
  };

  const handleCancel = () => {
    navigate(ROUTES.DETAILED_CVS.LIST);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to={ROUTES.DETAILED_CVS.LIST} className="btn btn-ghost btn-sm">
            ← Back to List
          </Link>
          <h1 className="text-2xl font-bold">
            {cv ? 'Edit' : 'Create'} Detailed CV
          </h1>
          <Badge>{languageName}</Badge>
        </div>
      </div>

      <DetailedCVForm
        mode={cv ? 'edit' : 'create'}
        languageCode={validLanguageCode}
        initialData={cv}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
