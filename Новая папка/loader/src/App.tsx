import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Lock, LogOut, MemoryStick, Minus, Pin, Play, Settings2, Shield, UserRound, X } from 'lucide-react';

type Tab = 'home' | 'settings';
type Subscription = { id: string; title: string; planId: string; status: 'active' | 'revoked'; expiresAt: string | null };
type AuthUser = { name: string; email: string; subscriptions: Subscription[] };

const TOKEN_KEY = 'maven_loader_token';
const DEVICE_KEY = 'maven_loader_device_id';
const RAM_KEY = 'maven_loader_ram_gb';

function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const next = `dev_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  localStorage.setItem(DEVICE_KEY, next);
  return next;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function versionAccess(subscriptions: Subscription[]) {
  const active = subscriptions.filter((sub) => sub.status === 'active');
  const hasBeta = active.some((sub) => {
    const src = `${normalize(sub.title)} ${normalize(sub.planId)}`;
    return src.includes('beta');
  });

  const hasBase = active.some((sub) => {
    const src = `${normalize(sub.title)} ${normalize(sub.planId)}`;
    if (src.includes('hwid')) return false;
    if (src.includes('beta')) return false;
    return src.includes('30') || src.includes('90') || src.includes('lifetime') || src.includes('life');
  });

  return { hasBase, hasBeta };
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [pinned, setPinned] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchStageText, setLaunchStageText] = useState('');

  const [apiUrl] = useState('http://localhost:8787');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [status, setStatus] = useState('');
  const maxRamSelectable = 8;
  const [ramGb, setRamGb] = useState(() => {
    const stored = Number(localStorage.getItem(RAM_KEY) || 4);
    if (!Number.isFinite(stored)) return 4;
    return Math.max(2, Math.min(8, stored));
  });

  const access = useMemo(() => versionAccess(user?.subscriptions || []), [user]);

  const products = useMemo(
    () => [
      {
        id: 'stable',
        title: 'Stable',
        subtitle: 'Main release branch',
        available: access.hasBase
      },
      {
        id: 'beta',
        title: 'Beta',
        subtitle: 'Early access channel',
        available: access.hasBeta
      }
    ],
    [access]
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const controller = new AbortController();
    setLoadingUser(true);

    fetch(`${apiUrl}/api/auth/me?lang=en`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-device-id': getDeviceId()
      },
      signal: controller.signal
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Cannot fetch profile');
        setUser(data.user);
        setStatus('');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setStatus(err instanceof Error ? err.message : 'Auth error');
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingUser(false);
      });

    return () => controller.abort();
  }, [token, apiUrl]);

  useEffect(() => {
    return window.loaderAPI.onLaunchStatus((event) => {
      setLaunchStageText(event.details || event.stage);
      if (event.stage === 'done') {
        setTimeout(() => {
          setLaunching(null);
          setLaunchStageText('');
        }, 800);
      }
    });
  }, []);

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');

    try {
      const res = await fetch(`${apiUrl}/api/auth/login?lang=en`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': getDeviceId()
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setPassword('');
      setStatus('Authorized');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Login failed');
    }
  }

  function saveRam() {
    localStorage.setItem(RAM_KEY, String(ramGb));
    setStatus(`RAM saved: ${ramGb} GB`);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setStatus('Logged out');
  }

  async function onLaunch(version: string) {
    if (!user) return;
    setLaunching(version);
    setLaunchStageText('Preparing launcher...');

    try {
      await window.loaderAPI.startLaunch({
        apiUrl,
        token,
        username: user.name,
        ramGb,
        version: version as 'stable' | 'beta'
      });
    } catch (error) {
      setLaunching(null);
      setLaunchStageText(error instanceof Error ? error.message : 'Launch failed');
    }
  }

  return (
    <div className="loader-shell">
      <div className="loader-backdrop" />
      <div className="loader-glow" />

      <header className="loader-navbar">
        <div className="loader-brand">
          <img src="/images/logo.png" alt="Maven" />
          <div>
            <strong>Maven</strong>
            <span>Compact Loader</span>
          </div>
        </div>

        <div className="loader-window-actions no-drag">
          <button onClick={async () => setPinned(await window.loaderAPI.togglePin())} className={pinned ? 'active' : ''}>
            <Pin size={12} />
          </button>
          <button onClick={() => window.loaderAPI.minimize()}>
            <Minus size={12} />
          </button>
          <button className="danger" onClick={() => window.loaderAPI.close()}>
            <X size={12} />
          </button>
        </div>
      </header>

      <main className="loader-content">
        <div className="tabs-row no-drag">
          <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
            <Play size={12} /> Home
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
            <Settings2 size={12} /> Settings
          </button>
        </div>

        {!token || !user ? (
          <section className="card auth-card no-drag">
            <h2>Sign in</h2>
            <form onSubmit={onLogin}>
              <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </label>
              <label>
                Password
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
              </label>
              <button type="submit">Login</button>
            </form>
            {status ? <p className="status-line">{status}</p> : null}
          </section>
        ) : null}

        {token && user && tab === 'home' ? (
          <section className="home-stack no-drag">
            <section className="card user-strip no-drag">
              <div>
                <p>
                  <img src="/images/avatar.jpeg" alt="Avatar" className="mini-avatar" />
                  <UserRound size={12} /> {user.name}
                </p>
                <span>{user.email}</span>
              </div>
              <button className="ghost" onClick={logout}>Logout</button>
            </section>

            <section className="card launch-list no-drag">
              {products.map((item) => (
                <article key={item.id} className={`launch-item ${item.available ? '' : 'locked'}`}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                    <small>
                      {item.available ? <Check size={12} /> : <Lock size={12} />}
                      {item.available ? 'Available' : 'Not purchased'}
                    </small>
                  </div>
                  <button
                    onClick={() => onLaunch(item.id)}
                    disabled={!item.available || launching !== null}
                    className="compact-btn"
                  >
                    {launching === item.id ? <span className="dot-loader" /> : <Play size={12} />}
                    {launching === item.id ? 'Launching...' : 'Launch'}
                  </button>
                </article>
              ))}

              <div className="subs-block">
                <p><Shield size={12} /> Active subscriptions</p>
                <ul>
                  {(user.subscriptions || []).filter((s) => s.status === 'active').map((s) => (
                    <li key={s.id}>{s.title}</li>
                  ))}
                </ul>
              </div>
              {launching ? <p className="status-line">{launchStageText || 'Downloading assets...'}</p> : null}
            </section>
          </section>
        ) : null}

        {tab === 'settings' ? (
          <section className="card settings-card no-drag">
            <article className="settings-section">
              <div className="settings-title-row">
                <p><MemoryStick size={13} /> Maximum RAM</p>
                <span>{ramGb} GB</span>
              </div>
              <input
                type="range"
                min={2}
                max={maxRamSelectable}
                step={1}
                value={ramGb}
                onChange={(e) => setRamGb(Number(e.target.value))}
              />
              <div className="settings-actions">
                <button className="compact-btn" onClick={saveRam}>Save RAM</button>
              </div>
            </article>

            {user ? (
              <article className="settings-section logout-section">
                <p><LogOut size={13} /> Session</p>
                <button className="ghost" onClick={logout}>Logout account</button>
              </article>
            ) : null}

            {status ? <p className="status-line">{status}</p> : null}
            {loadingUser ? <p className="status-line">Refreshing profile...</p> : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
