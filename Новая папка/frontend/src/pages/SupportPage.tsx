import { FormEvent, useEffect, useState } from 'react';
import { getPage, sendSupport } from '../lib/api';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';

type SupportData = { title: string; subtitle: string; channels: { name: string; details: string }[] };

export default function SupportPage() {
  const [data, setData] = useState<SupportData | null>(null);
  const [status, setStatus] = useState<string>('');
  const { locale } = useLocale();
  const tx = t(locale);

  useEffect(() => {
    getPage('support', locale).then((value) => setData(value as SupportData)).catch(() => undefined);
  }, [locale]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await sendSupport({
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        message: String(formData.get('message') || '')
      }, locale);
      setStatus(tx.support.success);
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : tx.support.failed);
    }
  };

  return (
    <main className="container route-page">
      <h1>{data?.title || tx.support.fallbackTitle}</h1>
      <p className="route-subtitle">{data?.subtitle || tx.support.fallbackSubtitle}</p>

      <div className="route-grid support-grid">
        <section className="route-card">
          <h3>{tx.support.formTitle}</h3>
          <form className="auth-form" onSubmit={onSubmit}>
            <input name="name" placeholder={tx.support.namePlaceholder} required minLength={2} />
            <input name="email" placeholder={tx.support.emailPlaceholder} type="email" required />
            <textarea name="message" placeholder={tx.support.messagePlaceholder} required minLength={8} rows={5} />
            <button type="submit" className="cta-btn primary">{tx.support.sendRequest}</button>
          </form>
          {status ? <p className="form-status">{status}</p> : null}
        </section>

        <section className="route-card">
          <h3>{tx.support.channels}</h3>
          <div className="channels-list">
            {(data?.channels || []).map((channel) => (
              <article key={channel.name}>
                <strong>{channel.name}</strong>
                <p>{channel.details}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
