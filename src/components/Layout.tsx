import React from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { Header } from './Header';
import { Footer } from './Footer';
import { useSession } from '@/hooks/useSession';

export function Layout() {
  // Initialize session management
  useSession();

  return (
    <ErrorBoundary>
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to content
      </a>

      <div className="relative min-h-screen flex flex-col bg-background-light dark:bg-background-dark transition-colors motion-reduce:transition-none overflow-hidden">
        {/* Animated gradient mesh background */}
        <div 
          className="fixed inset-0 gradient-mesh" 
          aria-hidden="true"
          role="presentation"
        />
        
        <Header />
        
        <main 
          id="main-content" 
          className="relative flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12"
          role="main"
          tabIndex={-1}
          aria-label="Main content"
        >
          <div className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 rounded-md">
            <Outlet />
          </div>
        </main>

        <Footer />

        <div 
          className="h-safe-area-bottom" 
          aria-hidden="true"
        />
      </div>
    </ErrorBoundary>
  );
}