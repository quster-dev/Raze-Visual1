import { useLocale } from '../lib/locale';

export default function RefundPolicyPage() {
  const { locale } = useLocale();

  return (
    <main className="container route-page">
      <h1>{locale === 'ru' ? 'Политика возвратов' : 'Refund Policy'}</h1>
      <section className="route-card">
        <p>
          {locale === 'ru'
            ? 'Запрос на возврат можно отправить через поддержку. Решение принимается после проверки статуса аккаунта и истории использования.'
            : 'Refund requests can be submitted through support. A decision is made after checking account status and usage history.'}
        </p>
      </section>
    </main>
  );
}
