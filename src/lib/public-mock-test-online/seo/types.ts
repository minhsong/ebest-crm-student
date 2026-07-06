export type MockTestOnlineSeoFaqItem = {
  question: string;
  answer: string;
};

export type MockTestOnlineSeoConfig = {
  landing: {
    indexable: boolean;
    title: string;
    description: string;
    canonicalUrl: string;
    ogImagePath: string;
    widgetTitle: string;
    widgetIntro: string;
  };
  embed: {
    title: string;
    description: string;
  };
  faq: MockTestOnlineSeoFaqItem[];
  schema: {
    enableFaqPage: boolean;
    enableEducationEvent: boolean;
    eventName: string;
    organizerName: string;
  };
};

export type MockTestOnlineSeoWidgetCopy = {
  widgetTitle: string;
  widgetIntro: string;
};
