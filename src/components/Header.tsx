import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/theme-toggle';
import { Menu, X, LogOut } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleTabKey = (e: React.KeyboardEvent) => {
    if (!isMenuOpen) return;

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    }
  };

  const handleLogout = () => {
    // Add your logout logic here
    navigate('/login');
  };

  return (
    <header 
      className="relative bg-background-light/80 dark:bg-background-dark/80 border-b border-border-light dark:border-border-dark sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background-light/80 supports-[backdrop-filter]:dark:bg-background-dark/80"
      role="banner"
    >
      <div className="header-gradient pointer-events-none" aria-hidden="true" />
      <div className="header-mesh pointer-events-none" aria-hidden="true" />

      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to content
      </a>

      <div className="container mx-auto">
        <div className="relative h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="nav-button text-2xl font-bold text-coral-500 hover:text-coral-hover px-3 py-2"
              aria-label="Bustr Home"
            >
              Bustr
            </Link>
            <nav 
              className="hidden md:flex space-x-1"
              aria-label="Main navigation"
            >
              <NavLink to="/">
                {({ isActive }) => (
                  <Button 
                    variant="ghost" 
                    className={`nav-button ${
                      isActive ? 'bg-coral-500/10 text-coral-500' : ''
                    }`}
                  >
                    Dashboard
                  </Button>
                )}
              </NavLink>
              <NavLink to="/settings">
                {({ isActive }) => (
                  <Button 
                    variant="ghost" 
                    className={`nav-button ${
                      isActive ? 'bg-coral-500/10 text-coral-500' : ''
                    }`}
                  >
                    Settings
                  </Button>
                )}
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <Button
              ref={firstFocusableRef}
              variant="ghost"
              size="icon"
              className="nav-button md:hidden"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Mobile menu panel */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`fixed right-0 top-0 h-full w-[80%] max-w-sm bg-background-light dark:bg-background-dark shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
        onKeyDown={handleTabKey}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
            <span className="text-lg font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <div className="flex flex-col p-4 space-y-1">
              <NavLink to="/" onClick={toggleMenu}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={`nav-button w-full justify-start ${
                      isActive ? 'bg-coral-500/10 text-coral-500' : ''
                    }`}
                  >
                    Dashboard
                  </Button>
                )}
              </NavLink>
              <NavLink to="/settings" onClick={toggleMenu}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    className={`nav-button w-full justify-start ${
                      isActive ? 'bg-coral-500/10 text-coral-500' : ''
                    }`}
                  >
                    Settings
                  </Button>
                )}
              </NavLink>
              <Button
                ref={lastFocusableRef}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}