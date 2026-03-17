import { BadgeCheck, FileText, Headset, Languages, Shield, ShoppingCart, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';
import { useAuth } from '../lib/auth-context';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, toggleLocale } = useLocale();
  const { token, user } = useAuth();
  const tx = t(locale);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="page-shell">
      <div className="ambient-layer" />
      <div className={`top-panel-bg ${location.pathname === '/' ? 'home-bound' : ''}`} aria-hidden="true" />
      <div className="top-nav-glow" aria-hidden="true" />

      <header className={`top-nav-wrap ${scrolled ? 'is-scrolled' : ''}`}>
        <nav className={`top-nav ${scrolled ? 'is-scrolled' : ''}`}>
          <NavLink to="/" className="brand-link">
            <img src="/images/logo.png" alt="Maven logo" className="brand-logo" />
            <span className="brand">Maven</span>
          </NavLink>

          <div className="menu-items">
            <NavLink to="/legal" className="menu-link with-icon"><FileText size={13} /> {tx.nav.legal}</NavLink>
            <NavLink to="/purchase" className="menu-link with-icon"><ShoppingCart size={13} /> {tx.nav.purchase}</NavLink>
            {user?.isAdmin ? <NavLink to="/admin" className="menu-link with-icon"><Shield size={13} /> {tx.nav.admin}</NavLink> : null}
            <a
              href="https://t.me/udptype"
              target="_blank"
              rel="noreferrer"
              className="menu-link with-icon"
            >
              <Headset size={13} /> {tx.nav.support}
            </a>
            <button type="button" className="menu-link compact lang-switch" onClick={toggleLocale}>
              <Languages size={14} /> {locale.toUpperCase()}
            </button>
          </div>

          {token ? (
            <button className="ghost-btn" onClick={() => navigate('/profile')}>
              <UserRound size={14} /> {tx.nav.profile}
            </button>
          ) : (
            <button className="ghost-btn" onClick={() => navigate('/auth')}>
              <BadgeCheck size={14} /> {tx.nav.signIn}
            </button>
          )}
        </nav>
      </header>

      <Outlet />
    </div>
  );
}
