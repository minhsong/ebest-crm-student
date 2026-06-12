/** Selector vùng scroll chính của dashboard Student Portal. */
export const QUIZ_DASHBOARD_SCROLL_SELECTOR = '.dashboard-layout-content';

export function getQuizDashboardScrollElement(): Element | null {
  return document.querySelector(QUIZ_DASHBOARD_SCROLL_SELECTOR);
}

export function readDashboardContentPadRight(scrollEl: Element): number {
  const styles = getComputedStyle(scrollEl);
  const raw = styles.getPropertyValue('--content-pad').trim();
  const pad = raw ? Number.parseFloat(raw) : Number.NaN;
  if (Number.isFinite(pad)) return pad;
  return Number.parseFloat(styles.paddingRight) || 8;
}
