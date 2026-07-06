export type PortalMarketingAboutBlock = {
  heading?: string;
  bodyHtml: string;
};

export type PortalMarketingCourse = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  ctaUrl?: string;
  sortOrder: number;
};

export type PortalMarketingPayload = {
  locale: string;
  consult: { zaloUrl: string; facebookUrl: string };
  about: { title: string; blocks: PortalMarketingAboutBlock[] };
  courses: PortalMarketingCourse[];
  updatedAt: string;
};
