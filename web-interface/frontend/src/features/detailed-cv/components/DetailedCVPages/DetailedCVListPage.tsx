import { useNavigate } from 'react-router-dom';
import { DetailedCVList } from '../DetailedCVList';
import { ROUTES } from '../../../../routes/paths';
import { LanguageCode } from '../../../../lib/language/types';

export function DetailedCVListPage() {
  const navigate = useNavigate();

  const handleCVSelect = (languageCode: LanguageCode) => {
    navigate(ROUTES.DETAILED_CVS.DETAIL(languageCode));
  };

  const handleCreateCVForLanguage = (languageCode: LanguageCode) => {
    navigate(ROUTES.DETAILED_CVS.CREATE(languageCode));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Detailed CVs</h1>
      <DetailedCVList
        onCVSelect={handleCVSelect}
        onCreateCV={handleCreateCVForLanguage}
      />
    </div>
  );
}
