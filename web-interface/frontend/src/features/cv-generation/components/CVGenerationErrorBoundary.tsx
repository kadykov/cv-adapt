import { Component, ReactNode } from 'react';
import { Button } from '@headlessui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specific to CV generation components
 * Provides fallback UI for runtime errors
 */
export class CVGenerationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="alert alert-error"
          role="alert"
          aria-live="assertive"
        >
          <div
            className="flex flex-col items-start gap-2"
          >
            <h3
              className="font-semibold"
              id="error-heading"
            >
              Failed to render CV generation component
            </h3>
            <p
              className="text-sm"
              id="error-message"
              aria-describedby="error-heading"
            >
              {this.state.error?.message || 'An unknown error occurred'}
            </p>
            <Button
              onClick={this.handleReset}
              className="btn btn-sm btn-ghost mt-2"
              type="button"
              aria-label="Try loading the component again"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
