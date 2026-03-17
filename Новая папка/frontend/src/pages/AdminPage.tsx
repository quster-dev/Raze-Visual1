import { useEffect, useMemo, useState } from 'react';
import {
  adminGrantSubscription,
  adminOverview,
  adminPlans,
  adminResetUserPassword,
  adminRevokeSubscription,
  adminSetUserStatus,
  adminUsers,
  type AdminPlan,
  type AuthUser
} from '../lib/api';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';
import { useAuth } from '../lib/auth-context';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { locale } = useLocale();
  const tx = t(locale);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [grantSelections, setGrantSelections] = useState<Record<string, string>>({});
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});

  const planOptions = useMemo(() => plans.map((p) => ({ value: p.id, label: p.title })), [plans]);
  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle));
  }, [users, query]);

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    if (!user?.isAdmin) {
      navigate('/profile');
      return;
    }

    const load = async () => {
      try {
        const [overview, usersRes, plansRes] = await Promise.all([
          adminOverview(token, locale),
          adminUsers(token, locale),
          adminPlans(token, locale)
        ]);
        setStats(overview.stats || {});
        setUsers(usersRes.users || []);
        setPlans(plansRes.plans || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, user?.isAdmin, locale, navigate]);

  const onChangeStatus = async (targetUser: AuthUser, status: 'active' | 'blocked') => {
    if (!token) return;
    try {
      const response = await adminSetUserStatus(token, locale, targetUser.id, status);
      setUsers((prev) => prev.map((entry) => (entry.id === targetUser.id ? response.user : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const onGrant = async (targetUser: AuthUser) => {
    if (!token) return;
    const planId = grantSelections[targetUser.id] || '';
    if (!planId) return;

    try {
      const response = await adminGrantSubscription(token, locale, targetUser.id, planId);
      setUsers((prev) => prev.map((entry) => (entry.id === targetUser.id ? response.user : entry)));
      setGrantSelections((prev) => ({ ...prev, [targetUser.id]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const onRevoke = async (targetUser: AuthUser, subscriptionId: string) => {
    if (!token) return;
    try {
      const response = await adminRevokeSubscription(token, locale, targetUser.id, subscriptionId);
      setUsers((prev) => prev.map((entry) => (entry.id === targetUser.id ? response.user : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const onResetPassword = async (targetUser: AuthUser) => {
    if (!token) return;
    const nextPassword = (passwordDrafts[targetUser.id] || '').trim();
    if (!nextPassword) return;

    try {
      const response = await adminResetUserPassword(token, locale, targetUser.id, nextPassword);
      setUsers((prev) => prev.map((entry) => (entry.id === targetUser.id ? response.user : entry)));
      setPasswordDrafts((prev) => ({ ...prev, [targetUser.id]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (loading) {
    return <main className="container route-page"><p>{tx.admin.loading}</p></main>;
  }

  return (
    <main className="container route-page admin-page">
      <h1>{tx.admin.title}</h1>
      <p className="route-subtitle">{tx.admin.subtitle}</p>
      {error ? <p className="form-status">{error}</p> : null}

      <section className="admin-stats-grid">
        <article className="route-card admin-stat"><span>{tx.admin.users}</span><strong>{stats.usersTotal || 0}</strong></article>
        <article className="route-card admin-stat"><span>{tx.admin.active}</span><strong>{stats.usersActive || 0}</strong></article>
        <article className="route-card admin-stat"><span>{tx.admin.blocked}</span><strong>{stats.usersBlocked || 0}</strong></article>
        <article className="route-card admin-stat"><span>{tx.admin.subscriptions}</span><strong>{stats.usersWithSubscriptions || 0}</strong></article>
      </section>

      <section className="route-card admin-tools">
        <div className="admin-search-wrap">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === 'ru' ? 'Поиск по имени или почте...' : 'Search by name or email...'}
            className="admin-search-input"
          />
        </div>
        <div className="admin-plan-list">
          {plans.map((plan) => (
            <article key={plan.id} className="admin-plan-card">
              <h4>{plan.title}</h4>
              <p>
                {plan.durationDays == null
                  ? locale === 'ru'
                    ? 'Без срока действия'
                    : 'No expiration'
                  : locale === 'ru'
                    ? `${plan.durationDays} дней`
                    : `${plan.durationDays} days`}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-users-list">
        {filteredUsers.map((targetUser) => (
          <article className="route-card admin-user-card" key={targetUser.id}>
            <div className="admin-user-head">
              <div>
                <h3>{targetUser.name}</h3>
                <p>{targetUser.email}</p>
              </div>
              <div className="admin-user-controls">
                <button
                  className="cta-btn"
                  onClick={() => onChangeStatus(targetUser, targetUser.status === 'blocked' ? 'active' : 'blocked')}
                >
                  {targetUser.status === 'blocked' ? tx.admin.unblock : tx.admin.block}
                </button>
              </div>
            </div>

            <div className="admin-user-subscriptions">
              <h4>{tx.admin.subscriptions}</h4>
              {targetUser.subscriptions.length === 0 ? <p>{tx.admin.noSubscriptions}</p> : null}
              {targetUser.subscriptions.map((sub) => (
                <div className="admin-sub-item" key={sub.id}>
                  <span>{sub.title}</span>
                  <span>{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US') : '∞'}</span>
                  <button className="link-btn" onClick={() => onRevoke(targetUser, sub.id)}>{tx.admin.revoke}</button>
                </div>
              ))}
            </div>

            <div className="admin-grant-form">
              <div className="admin-grant-plan-list">
                {planOptions.map((plan) => {
                  const selected = grantSelections[targetUser.id] === plan.value;
                  return (
                    <button
                      type="button"
                      key={`${targetUser.id}-${plan.value}`}
                      className={`admin-grant-plan-btn ${selected ? 'selected' : ''}`}
                      onClick={() =>
                        setGrantSelections((prev) => ({
                          ...prev,
                          [targetUser.id]: prev[targetUser.id] === plan.value ? '' : plan.value
                        }))
                      }
                    >
                      {plan.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="cta-btn primary"
                onClick={() => onGrant(targetUser)}
                disabled={!grantSelections[targetUser.id]}
              >
                {tx.admin.grant}
              </button>
            </div>

            <div className="admin-password-reset">
              <input
                type="password"
                value={passwordDrafts[targetUser.id] || ''}
                minLength={6}
                placeholder={tx.admin.newPassword}
                onChange={(event) =>
                  setPasswordDrafts((prev) => ({ ...prev, [targetUser.id]: event.target.value }))
                }
              />
              <button
                type="button"
                className="cta-btn"
                onClick={() => onResetPassword(targetUser)}
                disabled={!(passwordDrafts[targetUser.id] || '').trim()}
              >
                {tx.admin.resetPassword}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
