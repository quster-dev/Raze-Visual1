import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';
import { useAuth } from '../lib/auth-context';
import { AppWindow, Box, CalendarClock, KeyRound, Mail, Settings, ShieldCheck, UserRound, Users } from 'lucide-react';

type ProfileTab = 'account' | 'settings' | 'launcher' | 'products';

export default function ProfilePage() {
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState<ProfileTab>('account');
  const [licenseDraft, setLicenseDraft] = useState('');

  const navigate = useNavigate();
  const { locale } = useLocale();
  const tx = t(locale);
  const { user, token, loading, signOut, refresh, saveProfile } = useAuth();

  const memberDays = user ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000)) : 0;
  const activeSubscriptions = user?.subscriptions?.filter((sub) => sub.status !== 'revoked') || [];

  const labels = useMemo(
    () => ({
      account: locale === 'ru' ? 'Аккаунт' : 'Account',
      settings: locale === 'ru' ? 'Настройки' : 'Settings',
      launcher: locale === 'ru' ? 'Лаунчер' : 'Launcher',
      products: locale === 'ru' ? 'Товары' : 'Products',
      nickname: 'Nickname',
      registration: locale === 'ru' ? 'Регистрация' : 'Registration',
      linked: locale === 'ru' ? 'Привязан' : 'Linked',
      notLinked: locale === 'ru' ? 'Не привязан' : 'Not linked',
      subscriptionTill: locale === 'ru' ? 'Подписка до' : 'Subscription till',
      noSubscriptions: locale === 'ru' ? 'Подписки отсутствуют' : 'No subscriptions yet',
      userSubscriptions: locale === 'ru' ? 'Подписки пользователя' : 'User subscriptions',
      accountStatus: locale === 'ru' ? 'Статус аккаунта' : 'Account status',
      accountActive: locale === 'ru' ? 'Активен' : 'Active',
      accountBlocked: locale === 'ru' ? 'Заблокирован' : 'Blocked',
      hwid: 'HWID',
      launcherTools: locale === 'ru' ? 'Инструменты лаунчера' : 'Launcher tools',
      activateKey: locale === 'ru' ? 'Активировать License-Key' : 'Activate License-Key',
      enterKey: locale === 'ru' ? 'Введите ключ...' : 'Enter key...',
      activate: locale === 'ru' ? 'Активировать' : 'Activate',
      launcherHint: locale === 'ru' ? 'Функции лаунчера появятся в следующих обновлениях.' : 'Launcher features will appear in upcoming updates.'
    }),
    [locale]
  );

  useEffect(() => {
    if (!token && !loading) {
      navigate('/auth');
      return;
    }

    if (token) {
      refresh(locale).catch((err) => {
        setError(err instanceof Error ? err.message : 'Unauthorized');
        signOut();
        navigate('/auth');
      });
    }
  }, [token, loading, navigate, refresh, locale, signOut]);

  const onUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get('password') || '').trim();

    try {
      await saveProfile(
        {
          password: password.length > 0 ? password : undefined
        },
        locale
      );
      setStatus(tx.profile.updated);
      form.reset();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed');
    }
  };

  const onActivateLicense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!licenseDraft.trim()) return;
    setStatus(locale === 'ru' ? 'Ключ отправлен на проверку.' : 'Key submitted for verification.');
    setLicenseDraft('');
  };

  return (
    <main className="container route-page">
      {error ? <p className="form-status">{error}</p> : null}
      {user ? (
        <section className="profile-shell">
          <div className="profile-left-col">
            <article className="route-card profile-user-card">
              <div className="profile-identity">
                <div className="profile-avatar-wrap">
                  <img src="/images/avatar.jpeg" alt="User avatar" className="profile-avatar" />
                  <span className="profile-avatar-status" />
                </div>
                <div className="profile-hero-meta">
                  <h1>{user.name}</h1>
                  <p>
                    {activeSubscriptions.length > 0
                      ? `${labels.subscriptionTill} ${activeSubscriptions[0].expiresAt ? new Date(activeSubscriptions[0].expiresAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US') : 'Lifetime'}`
                      : labels.noSubscriptions}
                  </p>
                </div>
              </div>
              <button className="cta-btn profile-logout-btn" onClick={() => { signOut(); navigate('/auth'); }}>
                {tx.profile.logout}
              </button>
            </article>

            <article className="route-card profile-license-card">
              <h3>{labels.userSubscriptions}</h3>
              <div className="profile-subscription-list">
                {activeSubscriptions.length === 0 ? (
                  <p>{labels.noSubscriptions}</p>
                ) : activeSubscriptions.map((sub) => (
                  <div key={sub.id} className="profile-sub-item">
                    <strong>{sub.title}</strong>
                    <span>
                      {sub.expiresAt
                        ? `${locale === 'ru' ? 'до' : 'till'} ${new Date(sub.expiresAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}`
                        : 'Lifetime'}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="profile-right-col">
            <div className="profile-tabs">
              <button className={`profile-tab ${tab === 'account' ? 'active' : ''}`} onClick={() => setTab('account')}><UserRound size={14} /> {labels.account}</button>
              <button className={`profile-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}><Settings size={14} /> {labels.settings}</button>
              <button className={`profile-tab ${tab === 'launcher' ? 'active' : ''}`} onClick={() => setTab('launcher')}><AppWindow size={14} /> {labels.launcher}</button>
              <button className={`profile-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}><Box size={14} /> {labels.products}</button>
            </div>

            <section className="profile-tab-content">
              {tab === 'account' ? (
                <article className="route-card profile-info-grid-card">
                  <div className="profile-info-grid">
                    <div className="profile-info-box">
                      <p><Mail size={15} /> {labels.nickname}</p>
                      <strong>{user.name}</strong>
                    </div>
                    <div className="profile-info-box">
                      <p><CalendarClock size={15} /> {labels.registration}</p>
                      <strong>{new Date(user.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}</strong>
                    </div>
                    <div className="profile-info-box">
                      <p><ShieldCheck size={15} /> {labels.hwid}</p>
                      <strong className={user.hwidLinked ? 'status-linked' : 'status-unlinked'}>
                        {user.hwidLinked ? labels.linked : labels.notLinked}
                      </strong>
                      {user.hwid ? <small className="profile-hwid-id">{user.hwid}</small> : null}
                    </div>
                  </div>

                  <div className="profile-bottom-row">
                    <article className="route-card profile-mini-card">
                      <p><Users size={15} /> {locale === 'ru' ? 'Дней в системе' : 'Days as member'}</p>
                      <strong>{memberDays}</strong>
                    </article>
                    <article className="route-card profile-mini-card">
                      <p><ShieldCheck size={15} /> {labels.accountStatus}</p>
                      <strong>{user.status === 'blocked' ? labels.accountBlocked : labels.accountActive}</strong>
                    </article>
                  </div>
                </article>
              ) : null}

              {tab === 'settings' ? (
                <article className="route-card profile-edit-card">
                  <form className="auth-form profile-update-form" onSubmit={onUpdatePassword}>
                    <h3>{tx.profile.updateTitle}</h3>
                    <input name="password" type="password" placeholder={tx.profile.updatePassword} minLength={6} />
                    <button type="submit" className="cta-btn primary">{tx.profile.save}</button>
                  </form>
                  {status ? <p className="form-status">{status}</p> : null}
                </article>
              ) : null}

              {tab === 'launcher' ? (
                <article className="route-card profile-launcher-card">
                  <h3>{labels.launcherTools}</h3>
                  <form className="profile-license-form" onSubmit={onActivateLicense}>
                    <label>{labels.activateKey}</label>
                    <div className="profile-license-controls">
                      <div className="profile-license-input-wrap">
                        <KeyRound size={15} />
                        <input
                          value={licenseDraft}
                          onChange={(event) => setLicenseDraft(event.target.value)}
                          placeholder={labels.enterKey}
                          minLength={4}
                        />
                      </div>
                      <button type="submit" className="cta-btn primary">{labels.activate}</button>
                    </div>
                  </form>
                  <p className="route-subtitle profile-launcher-hint">{labels.launcherHint}</p>
                  {status ? <p className="form-status">{status}</p> : null}
                </article>
              ) : null}

              {tab === 'products' ? (
                <article className="route-card profile-products-card">
                  <h3>{labels.userSubscriptions}</h3>
                  <div className="profile-products-list">
                    {activeSubscriptions.length === 0 ? <p>{labels.noSubscriptions}</p> : activeSubscriptions.map((sub) => (
                      <div className="profile-product-row" key={sub.id}>
                        <div>
                          <strong>{sub.title}</strong>
                          <p>{sub.planId}</p>
                        </div>
                        <span>
                          {sub.expiresAt
                            ? `${locale === 'ru' ? 'до' : 'till'} ${new Date(sub.expiresAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}`
                            : 'Lifetime'}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </section>
          </div>
        </section>
      ) : (
        <p>{tx.profile.loading}</p>
      )}
    </main>
  );
}
