import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestErrorBoundary } from '../../../../test/utils/TestErrorBoundary';
import { IntegrationTestWrapper } from '../../../../lib/test/integration/test-wrapper';
import { AuthProvider } from '../../components/AuthProvider';

describe('Auth Error Boundary Integration', () => {
  describe('Error Handling', () => {
    test('should catch and display errors in component tree', () => {
      const ErrorComponent = () => {
        throw new Error('Simulated error in auth flow');
      };

      render(
        <IntegrationTestWrapper>
          <AuthProvider>
            <TestErrorBoundary>
              <ErrorComponent />
            </TestErrorBoundary>
          </AuthProvider>
        </IntegrationTestWrapper>,
      );

      expect(screen.getByText('Error Fallback')).toBeInTheDocument();
    });

    test('should not affect other components when one fails', () => {
      const WorkingComponent = () => <div>Working Component</div>;
      const ErrorComponent = () => {
        throw new Error('Simulated error');
      };

      render(
        <IntegrationTestWrapper>
          <AuthProvider>
            <div>
              <WorkingComponent />
              <TestErrorBoundary>
                <ErrorComponent />
              </TestErrorBoundary>
            </div>
          </AuthProvider>
        </IntegrationTestWrapper>,
      );

      expect(screen.getByText('Working Component')).toBeInTheDocument();
      expect(screen.getByText('Error Fallback')).toBeInTheDocument();
    });
  });
});
