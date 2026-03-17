const subscribers = new Set();

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function msg(req, en, ru) {
  return req.query.lang === 'ru' ? ru : en;
}

export function subscribe(req, res) {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !isEmail(email)) {
    return res.status(400).json({ error: msg(req, 'Valid email is required.', 'Укажите корректный email.') });
  }

  const normalized = email.trim().toLowerCase();
  subscribers.add(normalized);

  return res.status(201).json({ ok: true, total: subscribers.size });
}
