import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  props: any;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-frostee/50 to-white/50">
          <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl text-center border border-jewel/20">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100/50 rounded-2xl flex items-center justify-center">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-jewel mb-4">Something went wrong</h2>
            <p className="text-jewel/70 mb-6 leading-relaxed">
              We're sorry, but there was an unexpected error loading this page. 
              Your sidebar and navigation still work normally.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-red-50/50 rounded-xl text-left text-sm text-jewel/80 border border-red-200/50">
                <summary className="font-medium cursor-pointer mb-2">Error details (dev only)</summary>
                <pre className="whitespace-pre-wrap font-mono text-xs">{this.state.error?.toString()}</pre>
              </details>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-jewel text-white font-semibold rounded-xl hover:bg-jewel/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactNode;
  }
}

export default ErrorBoundary;

