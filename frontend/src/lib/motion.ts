import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useState } from 'react';

/**
 * Motion moments: route enter (fade + 8pt lift, 180 ms, no haptic, instant end state
 * when reduced motion is enabled); press (scale to .98 then back, spring, no haptic,
 * opacity-only fallback); catalog selection (state changes immediately, no animation-only state).
 */
export const motionDuration = { enter: 180, press: 110, stagger: 36 } as const;

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function getInitialReducedMotion() {
  if (Platform.OS !== 'web') return true;
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(reducedMotionQuery).matches
    : false;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(getInitialReducedMotion);

  useEffect(() => {
    let mounted = true;
    const update = (value: boolean) => { if (mounted) setReduced(value); };
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        update(false);
        return () => { mounted = false; };
      }
      const query = window.matchMedia(reducedMotionQuery);
      update(query.matches);
      const onChange = (event: MediaQueryListEvent) => update(event.matches);
      if (typeof query.addEventListener === 'function') query.addEventListener('change', onChange);
      else query.addListener(onChange);
      return () => {
        mounted = false;
        if (typeof query.removeEventListener === 'function') query.removeEventListener('change', onChange);
        else query.removeListener(onChange);
      };
    }
    void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => update(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  return reduced;
}
