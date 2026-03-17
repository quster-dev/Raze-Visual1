import { Link } from 'react-router-dom';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';

export default function NotFoundPage() {
  const { locale } = useLocale();
  const tx = t(locale);

  return (
    <main className="container route-page">
      <h1>404</h1>
      <p className="route-subtitle">{tx.notFound.subtitle}</p>
      <Link className="cta-btn" to="/">{tx.common.backHome}</Link>
    </main>
  );
}
