import React from 'react';
import { Button } from './button';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="border-border-light dark:border-border-dark"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-text-light dark:text-text-dark" />
      ) : (
        <Sun className="h-5 w-5 text-text-light dark:text-text-dark" />
      )}
    </Button>
  );
}