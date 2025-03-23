import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { determineStepFromPath } from '@/features/cv-generation/utils';
import { Steps } from '@/features/cv-generation/components/GenerationFlowLayout/Steps';
import { NavigationControls } from '@/features/cv-generation/components/GenerationFlowLayout/NavigationControls';

interface GenerationFlowLayoutProps {
  /**
   * Content to be rendered inside the layout
   */
  children: ReactNode;

  /**
   * Optional custom heading for the page
   */
  heading?: string;

  /**
   * Optional class name for styling
   */
  className?: string;

  /**
   * Whether to disable the next/continue button
   * @default false
   */
  disableNext?: boolean;
}

/**
 * Shared layout component for CV generation flow
 * Provides step tracking and consistent navigation
 */
export function GenerationFlowLayout({
  children,
  heading,
  className = '',
  disableNext = false,
}: GenerationFlowLayoutProps) {
  const { pathname } = useLocation();
  const currentStep = determineStepFromPath(pathname);

  return (
    <div className={`container mx-auto px-4 py-6 ${className}`}>
      {heading && <h1 className="text-2xl font-bold mb-6">{heading}</h1>}

      <Steps currentStep={currentStep} />

      <main className="mt-6">{children}</main>

      <div className="mt-8">
        <NavigationControls
          currentStep={currentStep}
          disableNext={disableNext}
        />
      </div>
    </div>
  );
}
