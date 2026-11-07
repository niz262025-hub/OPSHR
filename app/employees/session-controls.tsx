'use client';
import { useEffect, useState } from 'react';
import { useLocale } from '../locale-provider';
export default function SessionControls() {
  const { t } = useLocale();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let lastActivitySent = Date.now();
    let pending = false;
    async function check(activity: boolean) {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch('/api/session', { method: activity ? 'POST' : 'GET', cache: 'no-store', signal: controller.signal });
        if (response.status === 401) location.replace('https://www.myops.com.my/');
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
  async function logout() {
    if (busy) return;
    setBusy(true); setError(false);
    try {
      const response = await fetch('/api/session', { method: 'DELETE', cache: 'no-store' });
      if (!response.ok) throw new Error(t('logoutFailed'));
      location.replace('https://www.myops.com.my/');
    } catch { setError(true); setBusy(false); }
  }
  return <div><button className="secondary" onClick={logout} disabled={busy}>{busy ? t('loggingOut') : t('logout')}</button>{error ? <p role="alert">{t('logoutFailed')}</p> : null}</div>;
}
