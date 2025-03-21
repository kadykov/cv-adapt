import React from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDetailedCV } from '../../hooks/useDetailedCVs';
import { DetailedCVForm } from '../DetailedCVForm/DetailedCVForm';
import { ROUTES } from '../../../../routes/paths';
import { LanguageCode } from '../../../../lib/language/types';
import { getLanguageConfig } from '../../../../lib/language/config';
import { Badge } from '../../../../lib/components/Badge';

type PageMode = 'create' | 'edit';

export function DetailedCVFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { languageCode } = useParams<{
    languageCode: string;
  }>();

  // Extract mode from the URL path
  const isCreateMode = location.pathname.endsWith('/create');
  const isEditMode = location.pathname.endsWith('/edit');
  const mode: PageMode | undefined = isCreateMode
    ? 'create'
    : isEditMode
      ? 'edit'
      : undefined;

  const validLanguageCode =
    languageCode &&
    Object.values(LanguageCode).includes(
      languageCode.toLowerCase() as LanguageCode,
    )
      ? (languageCode.toLowerCase() as LanguageCode)
      : undefined;

  const {
    data: cv,
    isLoading,
    error,
  } = useDetailedCV(validLanguageCode, {
    enabled: mode === 'edit',
  });

  // Handle navigation for invalid parameters
  React.useEffect(() => {
    if (!validLanguageCode || !mode) {
      navigate(ROUTES.DETAILED_CVS.LIST);
    }
  }, [validLanguageCode, mode, navigate]);

  if (!validLanguageCode || !mode) {
    return null;
  }

  // Get language name - safe to access since we validated the code
  const languageName = getLanguageConfig(validLanguageCode).name;

  // Show loading only when fetching in edit mode
  if (mode === 'edit' && isLoading) {
    return (
      <div className="flex justify-center items-center">
        <span className="loading loading-spinner loading-lg" role="status" />
      </div>
    );
  }

  // Handle errors in edit mode
  if (mode === 'edit' && error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>An unexpected error occurred. Please try again.</span>
      </div>
    );
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
            {mode === 'edit' ? 'Edit' : 'Create'} Detailed CV
          </h1>
          <Badge>{languageName}</Badge>
        </div>
      </div>

      <DetailedCVForm
        mode={mode}
        languageCode={validLanguageCode}
        initialData={mode === 'edit' ? cv : undefined}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
