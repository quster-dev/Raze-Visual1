import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Boxes, Cloud, Cpu, Headset, MessageCircle, MousePointerClick, Rocket, Sparkles, SquareArrowOutUpRight } from 'lucide-react';
import Reveal from '../components/Reveal';
import type { SiteContent } from '../types';
import { getContent } from '../lib/api';
import { useLocale } from '../lib/locale';
import { t } from '../lib/translations';
import { Link } from 'react-router-dom';

const iconMap = {
  cloud: Cloud,
  keyboard: Cpu,
  support: Headset,
  chat: MessageCircle,
  speed: Rocket,
  customization: Sparkles
};

const fallbackContent: SiteContent = {
  brand: 'Maven',
  hero: {
    titleTop: 'Maven',
    titleAccent: 'Maven',
    titleBottom: 'Maven',
    subtitle: ''
  },
  featureIntro: {
    eyebrow: '',
    title: '',
    subtitle: ''
  },
  timeline: [],
  highlights: []
};

export default function HomePage() {
  const [content, setContent] = useState<SiteContent>(fallbackContent);
  const { locale } = useLocale();
  const tx = t(locale);
  const showcaseRef = useRef<HTMLDivElement | null>(null);
  const [spread, setSpread] = useState(0);

  useEffect(() => {
    getContent(locale).then((data) => setContent(data as SiteContent)).catch(() => undefined);
  }, [locale]);

  useEffect(() => {
    let rafId = 0;

    const updateSpread = () => {
      const node = showcaseRef.current;
      if (!node) {
        setSpread(0);
        return;
      }

      const rect = node.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const range = Math.max(window.innerHeight * 0.55, 420);

      // Before center: smoothly reveal side panels.
      // After center: keep them fully revealed until user scrolls back up.
      const next =
        elementCenter <= viewportCenter
          ? 1
          : Math.max(0, Math.min(1, 1 - (elementCenter - viewportCenter) / range));
      setSpread(next);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateSpread);
    };

    updateSpread();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <main>
      <section className="hero container">
        <Reveal><h1>{content.hero.titleTop} <span>{content.hero.titleAccent}</span> {content.hero.titleBottom}</h1></Reveal>
        <Reveal delay={120}><p className="hero-copy">{content.hero.subtitle}</p></Reveal>
        <Reveal delay={220}>
          <div className="hero-actions">
            <button className="cta-btn primary">{tx.home.purchaseProduct} <SquareArrowOutUpRight size={14} /></button>
            <button className="cta-btn">{tx.home.support}</button>
          </div>
        </Reveal>
        <Reveal delay={260}>
          <div
            ref={showcaseRef}
            className="showcase-grid"
            style={{ ['--spread' as string]: spread } as CSSProperties}
          >
            <img className="showcase-side left" src="/images/csgui-autobuy.png" alt="Maven autobuy panel" />
            <img className="showcase-main" src="/images/csgui-main.png" alt="Maven main panel" />
            <img className="showcase-side right" src="/images/csgui-configs.png" alt="Maven configs panel" />
          </div>
        </Reveal>
      </section>

      <section className="feature-intro container">
        <Reveal>
          <p className="eyebrow">{content.featureIntro.eyebrow}</p>
          <h2>{content.featureIntro.title}</h2>
          <p>{content.featureIntro.subtitle}</p>
        </Reveal>
      </section>

      <section className="testimonial container">
        <Reveal>
          <div className="testimonial-content">
            <h3>{tx.home.testimonialTitle}</h3>
            <p className="muted">{tx.home.testimonialSub}</p>
            <blockquote>"{tx.home.testimonialQuote}"</blockquote>
            <div className="author">{tx.home.testimonialAuthor}</div>
            <div className="hero-actions">
              <button className="cta-btn primary">{tx.home.purchaseProduct} <SquareArrowOutUpRight size={14} /></button>
              <button className="cta-btn">{tx.home.readReview}</button>
            </div>
          </div>
          <div className="testimonial-image-wrap"><img src="/images/settings.png" alt="Maven settings panel" /></div>
        </Reveal>
        <div className="cards-row">
          {content.highlights.map((item, idx) => (
            <Reveal key={item.index} delay={idx * 90}>
              <article className="info-card"><span>{item.index}</span><h4>{item.title}</h4><p>{item.description}</p></article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="timeline container">
        <Reveal>
          <p className="eyebrow">{tx.home.instantConfig}</p>
          <h2>{tx.home.cloudConfigs}</h2>
          <p className="timeline-subtitle">{tx.home.cloudSubtitle}</p>
        </Reveal>
        <div className="timeline-grid">
          {content.timeline.map((item, idx) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Boxes;
            return (
              <Reveal key={item.title} delay={idx * 90}>
                <article className="timeline-item"><div className="timeline-icon"><Icon size={17} /></div><h4>{item.title}</h4><p>{item.description}</p></article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="bottom-cta container">
        <Reveal>
          <div className="cta-box">
            <h2>{tx.home.bottomTitle}</h2>
            <p>{tx.home.bottomSub}</p>
            <div className="hero-actions centered">
              <button className="cta-btn pale">{tx.home.contactSupport} <SquareArrowOutUpRight size={14} /></button>
              <button className="cta-btn dark">{tx.home.purchaseProduct} <MousePointerClick size={14} /></button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="footer container">
        <div><div className="brand">Maven</div><p>{tx.home.footerDesc}</p></div>
        <div>
          <h5>{tx.home.product}</h5>
          <Link to="/download">{tx.home.download}</Link>
          <Link to="/purchase">{tx.home.plans}</Link>
          <a href="https://t.me/udptype" target="_blank" rel="noreferrer">{tx.nav.support}</a>
        </div>
        <div>
          <h5>{tx.home.legal}</h5>
          <Link to="/user-agreement">{tx.home.userAgreement}</Link>
          <Link to="/privacy-policy">{tx.home.privacyPolicy}</Link>
          <Link to="/refund-policy">{tx.home.refundPolicy}</Link>
        </div>
        <div>
          <h5>{tx.home.community}</h5>
          <a href="https://t.me/mavenclient" target="_blank" rel="noreferrer">Telegram</a>
        </div>
      </footer>
    </main>
  );
}
