'use client';

import { Layout } from 'antd';
import { APP_BRAND, APP_NAME, FOOTER_HEIGHT } from '@/lib/ui-constants';

const { Footer } = Layout;

export default function DashboardFooter() {
  return (
    <Footer
      style={{
        height: FOOTER_HEIGHT,
        lineHeight: `${FOOTER_HEIGHT}px`,
        textAlign: 'center',
        padding: 0,
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
      }}
    >
      © {new Date().getFullYear()} {APP_BRAND} – {APP_NAME}
    </Footer>
  );
}
