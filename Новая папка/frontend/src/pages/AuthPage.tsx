import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';
import { useAuth } from '../lib/auth-context';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const { locale } = useLocale();
  const tx = t(locale);
  const { signIn, signUp } = useAuth();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      if (mode === 'login') {
        await signIn({
          email: String(formData.get('email') || ''),
          password: String(formData.get('password') || '')
        }, locale);
      } else {
        await signUp({
          name: String(formData.get('name') || ''),
          email: String(formData.get('email') || ''),
          password: String(formData.get('password') || '')
        }, locale);
      }

      setStatus(tx.auth.success);
      navigate('/profile');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : tx.auth.failed);
    }
  };

  return (
    <main className="container route-page auth-page">
      <section className="route-card auth-card">
        <h1>{mode === 'login' ? tx.auth.signIn : tx.auth.createAccount}</h1>
        <p className="route-subtitle">{tx.auth.subtitle}</p>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === 'register' ? <input name="name" placeholder={tx.auth.name} required minLength={2} /> : null}
          <input name="email" type="email" placeholder={tx.auth.email} required />
          <input name="password" type="password" placeholder={tx.auth.password} required minLength={6} />
          <button type="submit" className="cta-btn primary">{mode === 'login' ? tx.auth.signIn : tx.auth.register}</button>
        </form>

        <button className="link-btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? tx.auth.needAccount : tx.auth.haveAccount}
        </button>

        {status ? <p className="form-status">{status}</p> : null}
      </section>
    </main>
  );
}
