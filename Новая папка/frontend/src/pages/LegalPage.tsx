import { useEffect, useState } from 'react';
import { getPage } from '../lib/api';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';
import { Link } from 'react-router-dom';

type LegalData = { title: string; subtitle: string; sections: { heading: string; body: string }[] };

export default function LegalPage() {
  const [data, setData] = useState<LegalData | null>(null);
  const { locale } = useLocale();
  const tx = t(locale);

  useEffect(() => {
    getPage('legal', locale).then((value) => setData(value as LegalData)).catch(() => undefined);
  }, [locale]);

  if (!data) return <main className="container route-page"><p>{tx.legal.loading}</p></main>;

  return (
    <main className="container route-page">
      <h1>{data.title}</h1>
      <p className="route-subtitle">{data.subtitle}</p>
      <div className="route-grid">
        {data.sections.map((section) => (
          <article className="route-card" key={section.heading}>
            <h3>{section.heading}</h3>
            <p>{section.body}</p>
          </article>
        ))}
      </div>
      <section className="route-card legal-policies">
        <h3>{locale === 'ru' ? 'Все policy' : 'All policies'}</h3>
        <div className="legal-policy-links">
          <Link to="/user-agreement">{tx.home.userAgreement}</Link>
          <Link to="/privacy-policy">{tx.home.privacyPolicy}</Link>
          <Link to="/refund-policy">{tx.home.refundPolicy}</Link>
        </div>
      </section>
    </main>
  );
}
