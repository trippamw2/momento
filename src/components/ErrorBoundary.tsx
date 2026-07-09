"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#05070B] px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-heading-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-[#CBD5E1] text-body mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-[#111827] text-white font-semibold text-body-sm border border-white/[0.1] hover:bg-white/5 transition-all"
              >
                Go Home
              </Link>
            </div>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <pre className="mt-6 p-4 rounded-xl bg-[#111827] border border-white/[0.08] text-caption text-red-300 text-left overflow-auto max-h-40">
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack?.split("\n").slice(1, 4).join("\n")}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
