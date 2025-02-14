import React from 'react';

export function Footer() {
  return (
    <footer 
      className="mt-auto py-6 bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark"
      role="contentinfo"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-light/60 dark:text-text-dark/60">
            © {new Date().getFullYear()} Bustr. All rights reserved.
          </p>
          <nav 
            className="flex space-x-4"
            aria-label="Footer navigation"
          >
            <a
              href="#"
              className="text-sm text-text-light/60 dark:text-text-dark/60 hover:text-coral-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 rounded-sm"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-text-light/60 dark:text-text-dark/60 hover:text-coral-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 rounded-sm"
            >
              Terms of Service
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}