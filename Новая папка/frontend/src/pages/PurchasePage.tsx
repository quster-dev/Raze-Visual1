import { useEffect, useMemo, useRef, useState } from 'react';
import { getPage } from '../lib/api';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';
import { BookCopy, CircleDot, Crosshair, LayoutGrid } from 'lucide-react';

type PurchaseData = {
  title: string;
  subtitle: string;
  usdRate: number;
  plans: { id: string; name: string; rubPrice: number; features: string[] }[];
};

type TabType = 'subscriptions' | 'additions';

export default function PurchasePage() {
  const [data, setData] = useState<PurchaseData | null>(null);
  const [tab, setTab] = useState<TabType>('subscriptions');
  const [hoverTab, setHoverTab] = useState<TabType | null>(null);
  const [pill, setPill] = useState({ left: 6, width: 140 });
  const switchRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLButtonElement | null>(null);
  const addRef = useRef<HTMLButtonElement | null>(null);
  const { locale } = useLocale();
  const tx = t(locale);

  useEffect(() => {
    getPage('purchase', locale).then((value) => setData(value as PurchaseData)).catch(() => undefined);
  }, [locale]);

  const products = useMemo(() => {
    if (!data) return [];
    const subscriptions = data.plans.filter((plan) => ['days-30', 'days-90', 'lifetime'].includes(plan.id));
    const additions = data.plans.filter((plan) => ['hwid-reset', 'beta-access'].includes(plan.id));
    return tab === 'subscriptions' ? subscriptions : additions;
  }, [data, tab]);
  const highlightedTab = hoverTab ?? tab;
  const subscriptionFeatures = locale === 'ru'
    ? [
        { text: '25+ визуальных функций', icon: LayoutGrid },
        { text: 'Быстрый DLC', icon: BookCopy },
        { text: 'Поддержка 24/7', icon: Crosshair },
        { text: 'Частые DLC-обновления', icon: CircleDot }
      ]
    : [
        { text: '25+ visual features', icon: LayoutGrid },
        { text: 'Fast-acting DLC', icon: BookCopy },
        { text: '24/7 user support', icon: Crosshair },
        { text: 'Frequent DLC updates', icon: CircleDot }
      ];

  useEffect(() => {
    const syncPill = () => {
      const root = switchRef.current;
      if (!root) return;
      const active = (hoverTab ?? tab) === 'subscriptions' ? subRef.current : addRef.current;
      if (!active) return;

      setPill({
        left: active.offsetLeft,
        width: active.offsetWidth
      });
    };

    syncPill();
    window.addEventListener('resize', syncPill);
    return () => window.removeEventListener('resize', syncPill);
  }, [tab, hoverTab, locale]);

  if (!data) return <main className="container route-page"><p>{tx.purchase.loading}</p></main>;

  return (
    <main className="container route-page purchase-page">
      <h1>{tx.purchase.browseTitle}</h1>
      <p className="route-subtitle purchase-subtitle">{tx.purchase.browseSub}</p>

      <div className="purchase-switch" role="tablist" aria-label="Purchase categories" ref={switchRef}>
        <span
          className="purchase-switch-pill"
          aria-hidden="true"
          style={{ left: `${pill.left}px`, width: `${pill.width}px` }}
        />
        <button
          ref={subRef}
          type="button"
          className={`purchase-switch-btn ${tab === 'subscriptions' ? 'active' : ''} ${highlightedTab === 'subscriptions' ? 'is-highlighted' : ''}`}
          onClick={() => setTab('subscriptions')}
          onMouseEnter={() => setHoverTab('subscriptions')}
          onMouseLeave={() => setHoverTab(null)}
        >
          <img src="/images/netherite-sword.png" alt="Subscriptions" className="purchase-icon-white" />
          {tx.purchase.subscriptions}
        </button>
        <button
          ref={addRef}
          type="button"
          className={`purchase-switch-btn ${tab === 'additions' ? 'active' : ''} ${highlightedTab === 'additions' ? 'is-highlighted' : ''}`}
          onClick={() => setTab('additions')}
          onMouseEnter={() => setHoverTab('additions')}
          onMouseLeave={() => setHoverTab(null)}
        >
          <img src="/images/totem-of-undying.png" alt="Additions" className="purchase-icon-white" />
          {tx.purchase.additions}
        </button>
      </div>

      <div className={`purchase-grid ${tab === 'additions' ? 'additions-grid' : ''}`}>
        {products.map((plan, idx) => {
          const price = locale === 'ru' ? `${plan.rubPrice} ₽` : `$${Math.round(plan.rubPrice / (data.usdRate || 90))}`;

          return (
            <article className={`purchase-card ${tab === 'subscriptions' ? 'subscription-card' : 'addition-card'}`} key={plan.id}>
              <p className="purchase-chosen">
                <img
                  src={tab === 'subscriptions' ? '/images/netherite-sword.png' : '/images/totem-of-undying.png'}
                  alt="chosen"
                  className="purchase-icon-white small"
                />
                {tx.purchase.chosenBy}
              </p>

              <div className="purchase-price-line">
                <span className="purchase-price">{price}</span>
                {tab === 'subscriptions' ? (
                  <span className="purchase-duration">/ {idx === 0 ? 30 : idx === 1 ? 90 : 999} {tx.purchase.daysSuffix}</span>
                ) : null}
              </div>

              <p className="purchase-plan-name">{plan.name}</p>

              <ul className="purchase-feature-list">
                {tab === 'subscriptions'
                  ? subscriptionFeatures.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={`${plan.id}-${item.text}`}>
                          <Icon size={13} />
                          {item.text}
                        </li>
                      );
                    })
                  : plan.features.map((feature) => (
                      <li key={feature}>
                        <img
                          src="/images/totem-of-undying.png"
                          alt="feature"
                          className="purchase-icon-white tiny"
                        />
                        {feature}
                      </li>
                    ))}
              </ul>

              <button className="purchase-buy-btn">{tx.purchase.buy}</button>
            </article>
          );
        })}
      </div>
    </main>
  );
}
