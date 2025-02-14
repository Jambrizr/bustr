import React from 'react';
import { useLocation } from 'react-router-dom';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const nodeRef = React.useRef(null);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={location.pathname}
        timeout={200} // Reduced from 300ms to 200ms for better performance
        classNames="page-transition"
        unmountOnExit
        nodeRef={nodeRef}
      >
        <div ref={nodeRef}>
          {children}
        </div>
      </CSSTransition>
    </SwitchTransition>
  );
}