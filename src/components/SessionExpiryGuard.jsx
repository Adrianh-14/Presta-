import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { portalService } from '../services/portalService';

const WARNING_SECONDS = 30;
const ACTIVE_WINDOW_MS = 90_000;
const RENEW_BEFORE_SECONDS = 5 * 60;

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Number(payload.exp) || null;
  } catch {
    return null;
  }
}

function clearClientSession() {
  ['clientToken', 'clientId', 'clientName', 'clientEmail', 'clientSessionExpiresAt'].forEach((key) => localStorage.removeItem(key));
}

export default function SessionExpiryGuard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [renewing, setRenewing] = useState(false);
  const [renewalError, setRenewalError] = useState('');
  const lastActivity = useRef(Date.now());
  const lastRenewAttempt = useRef(0);
  const renewalInFlight = useRef(false);

  const isClientRoute = location.pathname.startsWith('/portal') && !location.pathname.startsWith('/portal/login');
  const signOut = useCallback(() => {
    if (isClientRoute || localStorage.getItem('clientToken')) {
      clearClientSession();
      window.location.assign('/portal/login?reason=session-expired');
      return;
    }
    logout();
    window.location.assign('/login?reason=session-expired');
  }, [isClientRoute, logout]);

  const renew = useCallback(async () => {
    if (renewalInFlight.current) return;
    renewalInFlight.current = true;
    setRenewing(true);
    setRenewalError('');
    lastRenewAttempt.current = Date.now();
    try {
      if (isClientRoute || localStorage.getItem('clientToken')) {
        const session = await portalService.renewSession();
        localStorage.setItem('clientToken', session.token);
        localStorage.setItem('clientSessionExpiresAt', session.expiresAt);
      } else {
        await authService.refreshSession();
      }
      lastActivity.current = Date.now();
      setSecondsLeft(null);
    } catch {
      setRenewalError('No se pudo prolongar la sesión. Inicia sesión nuevamente.');
    } finally {
      renewalInFlight.current = false;
      setRenewing(false);
    }
  }, [isClientRoute]);

  useEffect(() => {
    const markActivity = () => { lastActivity.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    return () => events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
  }, []);

  useEffect(() => {
    setSecondsLeft(null);
    const checkSession = async () => {
      const clientToken = isClientRoute ? localStorage.getItem('clientToken') : null;
      const staffToken = !isClientRoute && user ? localStorage.getItem('accessToken') : null;
      const token = clientToken || staffToken;
      if (!token) { setSecondsLeft(null); return; }

      const expiresAt = getTokenExpiry(token);
      if (!expiresAt) return;
      const remaining = expiresAt - Math.floor(Date.now() / 1000);
      if (remaining <= 0) {
        signOut();
        return;
      }

      if (remaining <= WARNING_SECONDS) setSecondsLeft(remaining);
      else setSecondsLeft(null);

      const recentlyActive = Date.now() - lastActivity.current <= ACTIVE_WINDOW_MS;
      if (remaining <= RENEW_BEFORE_SECONDS && recentlyActive && Date.now() - lastRenewAttempt.current >= 15_000) await renew();
    };

    checkSession();
    const timer = window.setInterval(checkSession, 1000);
    return () => window.clearInterval(timer);
  }, [isClientRoute, location.pathname, renew, signOut, user]);

  if (secondsLeft === null || secondsLeft <= 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/55 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="session-expiry-title" className="w-full max-w-md rounded-16 border border-surface-border bg-white p-6 shadow-2xl sm:p-7">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-600"><Clock3 size={23} /></div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-600">Sesión protegida</p>
        <h2 id="session-expiry-title" className="mt-1 text-xl font-extrabold text-navy-800">Tu sesión está por vencer</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Por seguridad, se cerrará en <strong className="text-navy-800">{secondsLeft} segundos</strong>. Prolóngala para seguir trabajando.</p>
        {renewalError && <p className="mt-3 rounded-8 bg-danger-50 px-3 py-2 text-sm text-danger-600" role="alert">{renewalError}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={signOut} className="rounded-8 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-surface-hover">Cerrar sesión</button>
          <button type="button" onClick={renew} disabled={renewing} className="inline-flex items-center justify-center gap-2 rounded-8 gradient-accent px-4 py-3 text-sm font-bold text-white shadow-btn disabled:opacity-60">
            {renewing ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {renewing ? 'Prolongando…' : 'Prolongar sesión'}
          </button>
        </div>
      </section>
    </div>
  );
}
