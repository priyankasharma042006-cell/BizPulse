import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Catches render errors and failed chunk downloads so the user never sees a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled UI error:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunkFailed = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(this.state.error.message);
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-2 md:border-4 border-black shadow-hard-4 p-6 text-center">
          <h2 className="font-black uppercase text-xl tracking-tighter mb-2">
            {chunkFailed ? 'New version available' : 'Something broke'}
          </h2>
          <p className="text-sm font-medium text-gray-600 mb-4 break-words">
            {chunkFailed ? 'The app was updated. Reload to get the latest version.' : this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-red text-white border-2 border-black px-4 py-2 font-bold uppercase text-xs tracking-wider shadow-hard-4"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
