import { Link, useNavigate, useParams } from 'react-router-dom';
import { DetailedCVPreview } from '../DetailedCVPreview';
import { ROUTES } from '../../../../routes/paths';
import { LanguageCode } from '../../../../lib/language/types';

export function DetailedCVDetailPage() {
  const navigate = useNavigate();
  const { languageCode } = useParams<{ languageCode: string }>();

  // Return early if no languageCode
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

  const handleEdit = () => {
    navigate(ROUTES.DETAILED_CVS.FORM(languageCode));
  };

  const handleBack = () => {
    navigate(ROUTES.DETAILED_CVS.LIST);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to={ROUTES.DETAILED_CVS.LIST} className="btn btn-ghost btn-sm">
            ← Back to List
          </Link>
          <h1 className="text-2xl font-bold">Detailed CV</h1>
        </div>
      </div>
      <DetailedCVPreview
        languageCode={languageCode as LanguageCode}
        onEdit={handleEdit}
        onBack={handleBack}
      />
    </div>
  );
}
