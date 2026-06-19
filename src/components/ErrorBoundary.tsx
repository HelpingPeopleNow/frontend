import { h, Component, ComponentChildren } from 'preact';

interface Props {
  children: ComponentChildren;
  fallback?: ComponentChildren;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

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
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
