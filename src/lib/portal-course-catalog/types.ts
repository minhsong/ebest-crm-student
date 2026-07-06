export type PortalCourseCatalogItem = {
  id: number;
  code: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  detailUrl: string;
  sortOrder: number;
};

export type PortalSiteLinks = {
  locale: string;
  aboutUrl: string;
  zaloChatUrl: string;
  facebookMessengerUrl: string;
};

export type PortalExplorePayload = {
  locale: string;
  siteLinks: PortalSiteLinks;
  courses: PortalCourseCatalogItem[];
};

export const DEFAULT_PORTAL_LOCALE = 'vi-VN' as const;
