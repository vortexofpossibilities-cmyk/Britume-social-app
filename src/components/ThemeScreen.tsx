import React from 'react';
import type { ComponentType } from 'react';
import { ThemeBackground } from './ThemeUI';

/** Adds the active BRITUME material background behind a route without
 * changing that route's existing navigation, state, or business logic. */
export function withThemeBackground<P extends object>(Screen: ComponentType<P>) {
  function ThemedRoute(props: P) {
    return (
      <ThemeBackground>
        <Screen {...props} />
      </ThemeBackground>
    );
  }
  ThemedRoute.displayName = `Themed(${Screen.displayName || Screen.name || 'Route'})`;
  return ThemedRoute;
}
