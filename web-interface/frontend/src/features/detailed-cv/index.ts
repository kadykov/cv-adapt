/**
 * Detailed CV Management Feature
 *
 * This feature allows users to create, edit, and manage detailed CVs
 * that can be used as a basis for generating job-specific CVs.
 */

// Export components
export { DetailedCVList } from './components/DetailedCVList';
export { DetailedCVForm } from './components/DetailedCVForm';
export { DetailedCVPreview } from './components/DetailedCVPreview';

// Export hooks
export {
  useDetailedCVs,
  useDetailedCV,
  getAvailableLanguages,
} from './hooks/useDetailedCVs';
export { useDetailedCVMutations } from './hooks/useDetailedCVMutations';

// Export types
export type { DetailedCVFormData } from './components/DetailedCVForm/detailedCVFormSchema';
