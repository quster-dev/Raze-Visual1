import { randomUUID } from 'node:crypto';

const inbox = [];

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function msg(req, en, ru) {
  return req.query.lang === 'ru' ? ru : en;
}

export function submitContact(req, res) {
  const { name, email, message } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: msg(req, 'Name should contain at least 2 characters.', 'Имя должно содержать минимум 2 символа.') });
  }

  if (!email || typeof email !== 'string' || !isEmail(email)) {
    return res.status(400).json({ error: msg(req, 'Please provide a valid email address.', 'Укажите корректный email адрес.') });
  }

  if (!message || typeof message !== 'string' || message.trim().length < 8) {
    return res.status(400).json({ error: msg(req, 'Message should contain at least 8 characters.', 'Сообщение должно содержать минимум 8 символов.') });
  }

  const entry = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  inbox.push(entry);
  return res.status(201).json({ ok: true, id: entry.id });
}

export function listMessages(_req, res) {
  res.json({ total: inbox.length, items: inbox.slice(-50).reverse() });
}
