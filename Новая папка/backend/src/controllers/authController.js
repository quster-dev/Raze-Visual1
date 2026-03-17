import jwt from 'jsonwebtoken';
import { checkPassword, createUser, findUserByEmail, findUserById, linkHwidIfMissing, updateUser } from '../utils/userStore.js';
import { isAdminEmail } from '../utils/adminStore.js';

function makeToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'change-this-secret',
    { expiresIn: '7d' }
  );
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function lang(req) {
  return req.query.lang === 'ru' ? 'ru' : 'en';
}

function msg(req, en, ru) {
  return lang(req) === 'ru' ? ru : en;
}

function getDeviceId(req) {
  return String(req.headers['x-device-id'] || '').trim();
}

async function enrichUser(user) {
  return {
    ...user,
    isAdmin: await isAdminEmail(user.email)
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: msg(req, 'Name should contain at least 2 characters.', 'Имя должно содержать минимум 2 символа.') });
    }
    if (!email || typeof email !== 'string' || !isEmail(email)) {
      return res.status(400).json({ error: msg(req, 'Valid email is required.', 'Укажите корректный email.') });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: msg(req, 'Password should contain at least 6 characters.', 'Пароль должен содержать минимум 6 символов.') });
    }

    const user = await createUser({ name, email, password });
    const userWithRole = await enrichUser(user);
    const token = makeToken(userWithRole);

    return res.status(201).json({ ok: true, token, user: userWithRole });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(409).json({ error: msg(req, error.message, 'Пользователь с таким email уже существует.') });
    }
    return next(error);
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: msg(req, 'Email and password are required.', 'Email и пароль обязательны.') });
  }

  const user = await findUserByEmail(email);
  if (!user || !checkPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: msg(req, 'Invalid email or password.', 'Неверный email или пароль.') });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ error: msg(req, 'Your account is blocked.', 'Ваш аккаунт заблокирован.') });
  }

  const deviceId = getDeviceId(req);
  const linkedUser = await linkHwidIfMissing(user.id, deviceId);

  const safeUser = linkedUser || {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    status: user.status,
    subscriptions: user.subscriptions,
    hwid: user.hwid,
    hwidLinked: Boolean(user.hwid)
  };

  const userWithRole = await enrichUser(safeUser);
  const token = makeToken(userWithRole);

  return res.json({ ok: true, token, user: userWithRole });
}

export async function me(req, res) {
  const user = await findUserById(req.user.sub);
  if (!user) {
    return res.status(404).json({ error: msg(req, 'User not found.', 'Пользователь не найден.') });
  }

  const deviceId = getDeviceId(req);
  const linkedUser = await linkHwidIfMissing(user.id, deviceId);
  return res.json({ ok: true, user: await enrichUser(linkedUser || user) });
}

export async function updateProfileController(req, res) {
  const { name, password } = req.body;

  if (name && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({ error: msg(req, 'Name should contain at least 2 characters.', 'Имя должно содержать минимум 2 символа.') });
  }

  if (password && (typeof password !== 'string' || password.length < 6)) {
    return res.status(400).json({ error: msg(req, 'Password should contain at least 6 characters.', 'Пароль должен содержать минимум 6 символов.') });
  }

  const user = await updateUser(req.user.sub, { name, password });
  if (!user) {
    return res.status(404).json({ error: msg(req, 'User not found.', 'Пользователь не найден.') });
  }

  const userWithRole = await enrichUser(user);
  const token = makeToken(userWithRole);
  return res.json({ ok: true, token, user: userWithRole });
}
