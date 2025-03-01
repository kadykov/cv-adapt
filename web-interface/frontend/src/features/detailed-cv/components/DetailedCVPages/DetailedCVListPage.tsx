import { Link, useNavigate } from 'react-router-dom';
import { DetailedCVList } from '../DetailedCVList';
import { ROUTES } from '../../../../routes/paths';
import { LanguageCode } from '../../../../lib/language/types';

export function DetailedCVListPage() {
  const navigate = useNavigate();

  const handleCVSelect = (languageCode: LanguageCode) => {
    navigate(ROUTES.DETAILED_CVS.DETAIL(languageCode));
  };

  const handleCreateCV = () => {
    navigate(ROUTES.DETAILED_CVS.CREATE);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detailed CVs</h1>
        <Link to={ROUTES.DETAILED_CVS.CREATE} className="btn btn-primary">
          Add CV
        </Link>
      </div>
      <DetailedCVList onCVSelect={handleCVSelect} onCreateCV={handleCreateCV} />
    </div>
  );
}
