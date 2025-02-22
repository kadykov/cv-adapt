import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestErrorBoundary } from '../../../../test/utils/TestErrorBoundary';
import { ProvidersWrapper } from '../../../../test/setup/providers';

describe('Auth Error Boundary Integration', () => {
  describe('Error Handling', () => {
    it('should catch and display errors in component tree', () => {
      const ErrorComponent = () => {
        throw new Error('Simulated error in auth flow');
      };

      render(
        <ProvidersWrapper>
          <TestErrorBoundary>
            <ErrorComponent />
          </TestErrorBoundary>
        </ProvidersWrapper>,
      );

      expect(screen.getByText('Error Fallback')).toBeInTheDocument();
    });

    it('should not affect other components when one fails', () => {
      const WorkingComponent = () => <div>Working Component</div>;
      const ErrorComponent = () => {
        throw new Error('Simulated error');
      };

      render(
        <ProvidersWrapper>
          <div>
            <WorkingComponent />
            <TestErrorBoundary>
              <ErrorComponent />
            </TestErrorBoundary>
          </div>
        </ProvidersWrapper>,
      );

      expect(screen.getByText('Working Component')).toBeInTheDocument();
      expect(screen.getByText('Error Fallback')).toBeInTheDocument();
    });
  });
});
