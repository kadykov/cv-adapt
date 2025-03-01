import { Link, useNavigate } from 'react-router-dom';
import { DetailedCVForm } from '../DetailedCVForm';
import { ROUTES } from '../../../../routes/paths';

export function CreateDetailedCVPage() {
  const navigate = useNavigate();

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
          <h1 className="text-2xl font-bold">Create Detailed CV</h1>
        </div>
      </div>
      <DetailedCVForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
