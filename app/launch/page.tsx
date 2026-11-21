'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../locale-provider';
export default function Launch() {
  const { t } = useLocale();
  const started = useRef(false);
  const [message, setMessage] = useState<'launchLoading' | 'invalidSession' | 'launchFailed'>('launchLoading');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ticket = new URLSearchParams(location.hash.slice(1)).get('t');
    history.replaceState(null, '', '/launch');
    if (!ticket) { setMessage('invalidSession'); return; }
    void fetch('/api/session/launch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }), cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('launchFailed');
      location.replace('/employees');
    }).catch(() => setMessage('launchFailed'));
  }, [t]);
  return <section><h1>OpsHR</h1><p role="status">{t(message)}</p><a href="/api/myops-return">{t('backToMyops')}</a></section>;
}
