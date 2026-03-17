import { useLocale } from '../lib/locale';

export default function PrivacyPolicyPage() {
  const { locale } = useLocale();

  return (
    <main className="container route-page">
      <h1>{locale === 'ru' ? 'Политика приватности' : 'Privacy Policy'}</h1>
      <section className="route-card">
        <p>
          {locale === 'ru'
            ? 'Мы храним только необходимые данные аккаунта и обращения в поддержку. Персональные данные не передаются третьим лицам без основания.'
            : 'We store only required account data and support requests. Personal data is not shared with third parties without legal basis.'}
        </p>
      </section>
    </main>
  );
}
