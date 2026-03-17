import type { Locale } from './locale';

const API_URL = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL ??
  'http://localhost:8787';

export interface UserSubscription {
  id: string;
  planId: string;
  title: string;
  issuedAt: string;
  expiresAt: string | null;
  status: 'active' | 'revoked';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: 'active' | 'blocked';
  isAdmin: boolean;
  subscriptions: UserSubscription[];
  hwid: string | null;
  hwidLinked: boolean;
}

export interface AuthResponse {
  ok: boolean;
  token: string;
  user: AuthUser;
}

export interface AdminPlan {
  id: string;
  title: string;
  durationDays: number | null;
}

const deviceKey = 'maven_device_id';

function getDeviceId() {
  const existing = localStorage.getItem(deviceKey);
  if (existing) return existing;
  const next = `dev_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
  localStorage.setItem(deviceKey, next);
  return next;
}

function withLang(url: string, locale: Locale) {
  const connector = url.includes('?') ? '&' : '?';
  return `${url}${connector}lang=${locale}`;
}

async function fetchWithAuth<T>(url: string, token: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId()
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export async function getContent(locale: Locale) {
  const response = await fetch(withLang(`${API_URL}/api/content`, locale));
  if (!response.ok) throw new Error('Failed to load content');
  return response.json();
}

export async function getPage(slug: 'legal' | 'purchase' | 'support', locale: Locale) {
  const response = await fetch(withLang(`${API_URL}/api/pages/${slug}`, locale));
  if (!response.ok) throw new Error('Failed to load page');
  return response.json();
}

export async function register(payload: { name: string; email: string; password: string }, locale: Locale) {
  const response = await fetch(withLang(`${API_URL}/api/auth/register`, locale), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId()
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Registration failed');
  return data as AuthResponse;
}

export async function login(payload: { email: string; password: string }, locale: Locale) {
  const response = await fetch(withLang(`${API_URL}/api/auth/login`, locale), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId()
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data as AuthResponse;
}

export async function me(token: string, locale: Locale) {
  return fetchWithAuth<{ ok: boolean; user: AuthUser }>(withLang(`${API_URL}/api/auth/me`, locale), token, {
    method: 'GET'
  });
}

export async function updateProfile(payload: { name?: string; password?: string }, token: string, locale: Locale) {
  return fetchWithAuth<AuthResponse>(withLang(`${API_URL}/api/auth/profile`, locale), token, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function sendSupport(payload: { name: string; email: string; message: string }, locale: Locale) {
  const response = await fetch(withLang(`${API_URL}/api/contact`, locale), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Support request failed');
  return data;
}

export async function adminOverview(token: string, locale: Locale) {
  return fetchWithAuth<{ ok: boolean; stats: Record<string, number> }>(
    withLang(`${API_URL}/api/admin/overview`, locale),
    token,
    { method: 'GET' }
  );
}

export async function adminPlans(token: string, locale: Locale) {
  return fetchWithAuth<{ ok: boolean; plans: AdminPlan[] }>(
    withLang(`${API_URL}/api/admin/plans`, locale),
    token,
    { method: 'GET' }
  );
}

export async function adminUsers(token: string, locale: Locale) {
  return fetchWithAuth<{ ok: boolean; users: AuthUser[] }>(
    withLang(`${API_URL}/api/admin/users`, locale),
    token,
    { method: 'GET' }
  );
}

export async function adminSetUserStatus(token: string, locale: Locale, userId: string, status: 'active' | 'blocked') {
  return fetchWithAuth<{ ok: boolean; user: AuthUser }>(
    withLang(`${API_URL}/api/admin/users/${userId}/status`, locale),
    token,
    { method: 'PATCH', body: JSON.stringify({ status }) }
  );
}

export async function adminResetUserPassword(token: string, locale: Locale, userId: string, newPassword: string) {
  return fetchWithAuth<{ ok: boolean; user: AuthUser }>(
    withLang(`${API_URL}/api/admin/users/${userId}/password`, locale),
    token,
    { method: 'PATCH', body: JSON.stringify({ newPassword }) }
  );
}

export async function adminGrantSubscription(token: string, locale: Locale, userId: string, planId: string) {
  return fetchWithAuth<{ ok: boolean; user: AuthUser }>(
    withLang(`${API_URL}/api/admin/users/${userId}/subscriptions`, locale),
    token,
    { method: 'POST', body: JSON.stringify({ planId }) }
  );
}

export async function adminRevokeSubscription(token: string, locale: Locale, userId: string, subscriptionId: string) {
  return fetchWithAuth<{ ok: boolean; user: AuthUser }>(
    withLang(`${API_URL}/api/admin/users/${userId}/subscriptions/${subscriptionId}`, locale),
    token,
    { method: 'DELETE' }
  );
}
