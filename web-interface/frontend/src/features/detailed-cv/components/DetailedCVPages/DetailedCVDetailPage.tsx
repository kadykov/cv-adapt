import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react';
import { DetailedCVPreview } from '../DetailedCVPreview';
import { ROUTES } from '../../../../routes/paths';
import { LanguageCode } from '../../../../lib/language/types';
import { useDetailedCVMutations } from '../../hooks/useDetailedCVMutations';

export function DetailedCVDetailPage() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteCV } = useDetailedCVMutations();
  const navigate = useNavigate();
  const { languageCode } = useParams<{ languageCode: string }>();
  const isValidLanguageCode = Object.values(LanguageCode).includes(
    languageCode?.toLowerCase() as LanguageCode,
  );

  // Return early if no languageCode or invalid languageCode
  if (!languageCode || !isValidLanguageCode) {
    return (
      <div className="text-center py-8">
        <p className="text-error">Invalid language code.</p>
        <Link to={ROUTES.DETAILED_CVS.LIST} className="btn btn-ghost mt-4">
          Back to List
        </Link>
      </div>
    );
  }

  const validLanguageCode = languageCode.toLowerCase() as LanguageCode;

  const handleEdit = () => {
    navigate(ROUTES.DETAILED_CVS.FORM(languageCode));
  };

  const handleBack = () => {
    navigate(ROUTES.DETAILED_CVS.LIST);
  };

  const handleDelete = async () => {
    try {
      await deleteCV.mutateAsync(validLanguageCode);
      navigate(ROUTES.DETAILED_CVS.LIST);
    } catch (error) {
      console.error('Failed to delete CV:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to={ROUTES.DETAILED_CVS.LIST} className="btn btn-ghost btn-sm">
            ← Back to List
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Detailed CV</h1>
            <div className="badge badge-primary">
              {languageCode.toUpperCase()}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsDeleteDialogOpen(true)}
          className="btn btn-error btn-sm"
        >
          Delete CV
        </button>
      </div>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-lg bg-base-100 p-6">
            <DialogTitle className="text-lg font-bold">
              Delete Detailed CV
            </DialogTitle>
            <Description className="py-4">
              Are you sure you want to delete this CV? This action cannot be
              undone.
            </Description>
            <div className="mt-4 flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDelete}
                disabled={deleteCV.isPending}
              >
                {deleteCV.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      <DetailedCVPreview
        languageCode={validLanguageCode}
        onEdit={handleEdit}
        onBack={handleBack}
      />
    </div>
  );
}
