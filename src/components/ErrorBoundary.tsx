import { h, Component, ComponentChildren } from 'preact';
import { logError } from '../lib/logger';

interface Props {
  children: ComponentChildren;
  fallback?: ComponentChildren;
}

interface State {
  hasError: boolean;
  error?: Error;
  // Bumped on "Try again" to force remount of children (drops bad state).
  resetKey: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, resetKey: 0 };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    logError('app', 'ErrorBoundary caught an error:', error, info);
  }

  handleTryAgain = () => {
    this.setState((s: State) => ({
      hasError: false,
      error: undefined,
      resetKey: s.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div class="error-state" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 'var(--sp-3)' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            class="btn btn-secondary btn-sm"
            style={{ marginTop: 'var(--sp-4)' }}
            onClick={this.handleTryAgain}
          >
            Try again
          </button>
        </div>
      );
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
