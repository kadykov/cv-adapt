import { Link, useNavigate, useParams } from 'react-router-dom';
import { DetailedCVForm } from '../DetailedCVForm';
import { ROUTES } from '../../../../routes/paths';
import { useDetailedCV } from '../../hooks/useDetailedCVs';
import { LanguageCode } from '../../../../lib/language/types';

export function EditDetailedCVPage() {
  const navigate = useNavigate();
  const { languageCode } = useParams<{ languageCode: string }>();
  const {
    data: cv,
    isLoading,
    error,
  } = useDetailedCV(languageCode ? (languageCode as LanguageCode) : undefined);

  const handleSuccess = () => {
    navigate(ROUTES.DETAILED_CVS.LIST);
  };

  const handleCancel = () => {
    navigate(ROUTES.DETAILED_CVS.LIST);
  };

  if (!languageCode) {
    return (
      <div className="text-center py-8">
        <p className="text-error">Invalid language code.</p>
        <Link to={ROUTES.DETAILED_CVS.LIST} className="btn btn-ghost mt-4">
          Back to List
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <span
          className="loading loading-spinner loading-lg"
          role="status"
          aria-label="Loading..."
        />
      </div>
    );
  }

  if (error || !cv) {
    return (
      <div className="text-center py-8">
        <p className="text-error">Failed to load CV data. Please try again.</p>
        <Link to={ROUTES.DETAILED_CVS.LIST} className="btn btn-ghost mt-4">
          Back to List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to={ROUTES.DETAILED_CVS.LIST} className="btn btn-ghost btn-sm">
            ← Back to List
          </Link>
          <h1 className="text-2xl font-bold">Edit Detailed CV</h1>
        </div>
      </div>
      <DetailedCVForm
        mode="edit"
        languageCode={languageCode as LanguageCode}
        initialData={cv}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
