import { siteContent } from '../config/content.js';

function resolveLang(lang) {
  return lang === 'ru' ? 'ru' : 'en';
}

export function getContent(req, res) {
  const lang = resolveLang(req.query.lang);
  res.json(siteContent[lang]);
}
