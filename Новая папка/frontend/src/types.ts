export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
}

export interface HighlightItem {
  index: string;
  title: string;
  description: string;
}

export interface SiteContent {
  brand: string;
  hero: {
    titleTop: string;
    titleAccent: string;
    titleBottom: string;
    subtitle: string;
  };
  featureIntro: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  timeline: FeatureItem[];
  highlights: HighlightItem[];
}
