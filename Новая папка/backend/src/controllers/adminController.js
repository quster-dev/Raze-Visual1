import {
  adminListUsers,
  addUserSubscription,
  removeUserSubscription,
  setUserStatus,
  getUserByIdAdmin,
  updateUser
} from '../utils/userStore.js';

const plans = {
  'days-30': { title: '30 Days', durationDays: 30 },
  'days-90': { title: '90 Days', durationDays: 90 },
  lifetime: { title: 'LifeTime', durationDays: null },
  'hwid-reset': { title: 'HWID Reset', durationDays: null },
  'beta-access': { title: 'Beta Access', durationDays: null }
};

function msg(req, en, ru) {
  return req.query.lang === 'ru' ? ru : en;
}

export async function adminOverview(_req, res) {
  const users = await adminListUsers();
  const active = users.filter((u) => u.status !== 'blocked').length;
  const blocked = users.filter((u) => u.status === 'blocked').length;
  const withSubscriptions = users.filter((u) => (u.subscriptions || []).length > 0).length;

  res.json({
    ok: true,
    stats: {
      usersTotal: users.length,
      usersActive: active,
      usersBlocked: blocked,
      usersWithSubscriptions: withSubscriptions
    }
  });
}

export async function adminUsers(_req, res) {
  const users = await adminListUsers();
  res.json({ ok: true, users });
}

export async function adminSetStatus(req, res) {
  const { status } = req.body;

  if (status !== 'active' && status !== 'blocked') {
    return res.status(400).json({ error: msg(req, 'Invalid status value.', 'Некорректный статус.') });
  }

  const user = await setUserStatus(req.params.userId, status);
  if (!user) {
    return res.status(404).json({ error: msg(req, 'User not found.', 'Пользователь не найден.') });
  }

  return res.json({ ok: true, user });
}

export async function adminResetPassword(req, res) {
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: msg(req, 'New password must contain at least 6 characters.', 'Новый пароль должен содержать минимум 6 символов.') });
  }

  const user = await updateUser(req.params.userId, { password: newPassword });
  if (!user) {
    return res.status(404).json({ error: msg(req, 'User not found.', 'Пользователь не найден.') });
  }

  return res.json({ ok: true, user });
}

export async function adminGrantSubscription(req, res) {
  const { planId } = req.body;

  if (!planId || !plans[planId]) {
    return res.status(400).json({ error: msg(req, 'Unknown planId.', 'Неизвестный planId.') });
  }

  const plan = plans[planId];
  const now = new Date();
  const expiresAt = plan.durationDays == null
    ? null
    : new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();

  const subscription = {
    id: `sub_${Math.random().toString(36).slice(2, 10)}`,
    planId,
    title: plan.title,
    issuedAt: now.toISOString(),
    expiresAt,
    status: 'active'
  };

  const user = await addUserSubscription(req.params.userId, subscription);
  if (!user) {
    return res.status(404).json({ error: msg(req, 'User not found.', 'Пользователь не найден.') });
  }

  return res.status(201).json({ ok: true, user, subscription });
}

export async function adminRevokeSubscription(req, res) {
  const { userId, subscriptionId } = req.params;
  const user = await removeUserSubscription(userId, subscriptionId);

  if (!user) {
    return res.status(404).json({ error: msg(req, 'User or subscription not found.', 'Пользователь или подписка не найдены.') });
  }

  return res.json({ ok: true, user });
}

export async function adminUserDetails(req, res) {
  const user = await getUserByIdAdmin(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: msg(req, 'User not found.', 'Пользователь не найден.') });
  }

  return res.json({ ok: true, user });
}

export function adminPlans(_req, res) {
  res.json({ ok: true, plans: Object.entries(plans).map(([id, value]) => ({ id, ...value })) });
}
