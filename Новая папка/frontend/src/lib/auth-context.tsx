import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { login, me, register, updateProfile, type AuthUser } from './api';
import type { Locale } from './locale';

const tokenKey = 'maven_token';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (payload: { email: string; password: string }, locale: Locale) => Promise<void>;
  signUp: (payload: { name: string; email: string; password: string }, locale: Locale) => Promise<void>;
  signOut: () => void;
  refresh: (locale: Locale) => Promise<void>;
  saveProfile: (payload: { name?: string; password?: string }, locale: Locale) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKey));
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (locale: Locale) => {
    const currentToken = localStorage.getItem(tokenKey);
    if (!currentToken) {
      setUser(null);
      setToken(null);
      return;
    }

    const result = await me(currentToken, locale);
    setUser(result.user);
    setToken(currentToken);
  }, []);

  useEffect(() => {
    refresh('en').catch(() => {
      localStorage.removeItem(tokenKey);
      setUser(null);
      setToken(null);
    }).finally(() => setLoading(false));
  }, [refresh]);

  const signIn = useCallback(async (payload: { email: string; password: string }, locale: Locale) => {
    const result = await login(payload, locale);
    localStorage.setItem(tokenKey, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const signUp = useCallback(async (payload: { name: string; email: string; password: string }, locale: Locale) => {
    const result = await register(payload, locale);
    localStorage.setItem(tokenKey, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setUser(null);
  }, []);

  const saveProfile = useCallback(async (payload: { name?: string; password?: string }, locale: Locale) => {
    const currentToken = localStorage.getItem(tokenKey);
    if (!currentToken) {
      throw new Error(locale === 'ru' ? 'Вы не авторизованы.' : 'You are not authenticated.');
    }

    const result = await updateProfile(payload, currentToken, locale);
    localStorage.setItem(tokenKey, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, signIn, signUp, signOut, refresh, saveProfile }),
    [user, token, loading, signIn, signUp, signOut, refresh, saveProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
