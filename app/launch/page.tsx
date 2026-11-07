'use client';
import { useEffect, useRef, useState } from 'react';
export default function Launch() {
  const started = useRef(false);
  const [message, setMessage] = useState('Membuka OpsHR…');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ticket = new URLSearchParams(location.hash.slice(1)).get('t');
    history.replaceState(null, '', '/launch');
    if (!ticket) { setMessage('Sesi tidak sah. Buka OpsHR melalui MYOPS.'); return; }
    void fetch('/api/session/launch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }), cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('OpsHR belum dapat dibuka. Cuba semula melalui MYOPS.');
      location.replace('/employees');
    }).catch(error => setMessage(error.message));
  }, []);
  return <section><h1>OpsHR</h1><p role="status">{message}</p><a href="https://www.myops.com.my/">Kembali ke MYOPS</a></section>;
}
