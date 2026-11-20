import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

/**
 * Motion moments: route enter (fade + 8pt lift, 180 ms, no haptic, instant end state
 * when reduced motion is enabled); press (scale to .98 then back, spring, no haptic,
 * opacity-only fallback); catalog selection (state changes immediately, no animation-only state).
 */
export const motionDuration = { enter: 180, press: 110, stagger: 36 } as const;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    let mounted = true;
    const update = (value: boolean) => { if (mounted) setReduced(value); };
    void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => update(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  return reduced;
}
