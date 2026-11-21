'use client';
import { useEffect } from 'react';
export default function SessionControls() {
  useEffect(() => {
    const controller = new AbortController();
    let lastActivitySent = Date.now();
    let pending = false;
    async function check(activity: boolean) {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch('/api/session', { method: activity ? 'POST' : 'GET', cache: 'no-store', signal: controller.signal });
        if (response.status === 401) location.replace('/api/myops-return');
      } catch { /* A temporary network failure must not renew the session. */ }
      finally { pending = false; }
    }
    function activity(event: Event) {
      if (!event.isTrusted || Date.now() - lastActivitySent < 60000) return;
      lastActivitySent = Date.now(); void check(true);
    }
    const timer = setInterval(() => { void check(false); }, 60000);
    window.addEventListener('pointerdown', activity, { passive: true });
    window.addEventListener('keydown', activity);
    return () => { clearInterval(timer); controller.abort(); window.removeEventListener('pointerdown', activity); window.removeEventListener('keydown', activity); };
  }, []);
  return null;
}
