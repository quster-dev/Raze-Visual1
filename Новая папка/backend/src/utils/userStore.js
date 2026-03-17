import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.resolve(__dirname, '../data/users.json');

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expectedHash] = stored.split(':');
  if (!salt || !expectedHash) return false;
  const actualHash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}

function normalizeUserShape(user) {
  return {
    ...user,
    status: user.status === 'blocked' ? 'blocked' : 'active',
    subscriptions: Array.isArray(user.subscriptions) ? user.subscriptions : [],
    hwid: typeof user.hwid === 'string' && user.hwid.trim() ? user.hwid : null
  };
}

async function readUsers() {
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw).map(normalizeUserShape);
}

async function writeUsers(users) {
  await fs.writeFile(dataFile, JSON.stringify(users, null, 2));
}

function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    status: user.status,
    subscriptions: user.subscriptions,
    hwid: user.hwid,
    hwidLinked: Boolean(user.hwid)
  };
}

export async function createUser({ email, password, name }) {
  const users = await readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('Email already registered.');
  }

  const user = normalizeUserShape({
    id: randomBytes(12).toString('hex'),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    hwid: null
  });

  users.push(user);
  await writeUsers(users);

  return toSafeUser(user);
}

export async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find((user) => user.email === email.trim().toLowerCase()) || null;
}

export async function findUserById(id) {
  const users = await readUsers();
  const user = users.find((entry) => entry.id === id);
  if (!user) return null;
  return toSafeUser(user);
}

export async function updateUser(id, updates) {
  const users = await readUsers();
  const index = users.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  if (updates.name) {
    users[index].name = updates.name.trim();
  }

  if (updates.password) {
    users[index].passwordHash = hashPassword(updates.password);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'hwid')) {
    users[index].hwid = updates.hwid || null;
  }

  await writeUsers(users);
  return toSafeUser(users[index]);
}

export async function linkHwidIfMissing(userId, deviceId) {
  if (!deviceId || typeof deviceId !== 'string') return null;
  const normalized = deviceId.trim();
  if (!normalized) return null;

  const users = await readUsers();
  const index = users.findIndex((entry) => entry.id === userId);
  if (index === -1) return null;

  if (!users[index].hwid) {
    users[index].hwid = normalized;
    await writeUsers(users);
  }

  return toSafeUser(users[index]);
}

export async function adminListUsers() {
  const users = await readUsers();
  return users.map(toSafeUser);
}

export async function getUserByIdAdmin(id) {
  const users = await readUsers();
  const user = users.find((entry) => entry.id === id);
  return user ? toSafeUser(user) : null;
}

export async function setUserStatus(id, status) {
  const users = await readUsers();
  const index = users.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  users[index].status = status;
  await writeUsers(users);
  return toSafeUser(users[index]);
}

export async function addUserSubscription(id, subscription) {
  const users = await readUsers();
  const index = users.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  users[index].subscriptions.push(subscription);
  await writeUsers(users);
  return toSafeUser(users[index]);
}

export async function removeUserSubscription(id, subscriptionId) {
  const users = await readUsers();
  const index = users.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  const before = users[index].subscriptions.length;
  users[index].subscriptions = users[index].subscriptions.filter((sub) => sub.id !== subscriptionId);
  if (before === users[index].subscriptions.length) {
    return null;
  }

  await writeUsers(users);
  return toSafeUser(users[index]);
}

export function checkPassword(password, passwordHash) {
  return verifyPassword(password, passwordHash);
}
