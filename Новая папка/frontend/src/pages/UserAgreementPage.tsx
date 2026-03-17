import { useLocale } from '../lib/locale';

export default function UserAgreementPage() {
  const { locale } = useLocale();

  return (
    <main className="container route-page">
      <h1>{locale === 'ru' ? 'Пользовательское соглашение' : 'User Agreement'}</h1>
      <section className="route-card">
        <p>
          {locale === 'ru'
            ? 'Используя Maven, вы соглашаетесь соблюдать правила сервиса, не распространять приватные файлы и не передавать доступ третьим лицам.'
            : 'By using Maven, you agree to follow service rules, avoid redistributing private files, and not share account access with third parties.'}
        </p>
      </section>
    </main>
  );
}
