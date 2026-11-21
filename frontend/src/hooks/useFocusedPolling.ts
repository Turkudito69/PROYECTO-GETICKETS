import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/** Run a quiet refresh only while its route is visible. */
export function useFocusedPolling(refresh: () => void | Promise<unknown>, intervalMs = 5000) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useFocusEffect(useCallback(() => {
    let active = true;
    let inFlight = false;
    const timer = setInterval(() => {
      if (!active || inFlight) return;
      inFlight = true;
      void Promise.resolve(refreshRef.current())
        .catch(() => undefined)
        .finally(() => { inFlight = false; });
    }, intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [intervalMs]));
}
