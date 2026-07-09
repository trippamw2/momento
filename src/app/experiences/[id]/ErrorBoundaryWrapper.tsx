"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundaryWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="pt-24 pb-16 min-h-screen flex items-center justify-center bg-ambient-warm">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-[#FFF0F3] flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#ff385c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
            </div>
            <h1 className="text-display-sm font-bold text-[#222222] mb-3">Couldn&apos;t load this experience</h1>
            <p className="text-[#6a6a6a] text-body mb-6">
              Something went wrong while rendering this experience page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-8 py-3 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all"
              >
                Try Again
              </button>
              <Link
                href="/experiences"
                className="px-8 py-3 rounded-xl bg-white text-[#222222] font-semibold text-body-sm border border-[#ebebeb] hover:bg-[#FFF8F0] transition-all"
              >
                Browse Experiences
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
