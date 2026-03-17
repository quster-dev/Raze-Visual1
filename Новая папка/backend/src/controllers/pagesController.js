import { pages } from '../config/pages.js';

function resolveLang(lang) {
  return lang === 'ru' ? 'ru' : 'en';
}

export function listPages(req, res) {
  const lang = resolveLang(req.query.lang);

  res.json({
    items: Object.entries(pages).map(([slug, page]) => {
      const localized = page[lang] || page.en;
      return { slug, title: localized.title, subtitle: localized.subtitle };
    })
  });
}

export function getPage(req, res) {
  const lang = resolveLang(req.query.lang);
  const page = pages[req.params.slug];

  if (!page) {
    return res.status(404).json({ error: lang === 'ru' ? 'Страница не найдена.' : 'Page not found.' });
  }

  const localized = page[lang] || page.en;
  const response = { ...localized };

  if (typeof page.usdRate === 'number') {
    response.usdRate = page.usdRate;
  }

  return res.json(response);
}
