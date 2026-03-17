import { useLocale } from '../lib/locale';

export default function DownloadPage() {
  const { locale } = useLocale();

  return (
    <main className="container route-page">
      <h1>{locale === 'ru' ? 'Скачать Maven' : 'Download Maven'}</h1>
      <p className="route-subtitle">
        {locale === 'ru'
          ? 'Выберите подходящую сборку клиента и следуйте инструкции по установке.'
          : 'Choose the appropriate client build and follow the installation instructions.'}
      </p>
      <section className="route-card">
        <h3>{locale === 'ru' ? 'Инструкция' : 'Instructions'}</h3>
        <p>
          {locale === 'ru'
            ? '1) Авторизуйтесь в аккаунте. 2) Перейдите в раздел Purchase. 3) После оплаты загрузка станет доступна в личном кабинете.'
            : '1) Sign in to your account. 2) Open Purchase. 3) After payment, download becomes available in your profile.'}
        </p>
      </section>
    </main>
  );
}
