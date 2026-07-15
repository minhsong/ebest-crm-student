import type { MockTestOnlineSeoConfig } from './types';

/** Fallback khi CRM chưa phản hồi — đồng bộ default CRM `mock_test_online_seo`. */
export const MOCK_TEST_ONLINE_SEO_FALLBACK: MockTestOnlineSeoConfig = {
  landing: {
    indexable: true,
    title: 'Thi thử online miễn phí | Ebest English',
    description:
      'Đăng ký thi thử online miễn phí tại Ebest English. Chọn bài thi phù hợp, xác minh Zalo, làm bài trên máy tính hoặc điện thoại, nhận kết quả qua Zalo và email.',
    canonicalUrl: '',
    ogImagePath: '/og-image.png',
    widgetTitle: 'Đăng ký',
    widgetIntro:
      'Điền thông tin liên hệ để bắt đầu. Sau bước này bạn sẽ chọn bài thi và xác minh qua Zalo.',
  },
  embed: {
    title: 'Thi thử online — Ebest English',
    description:
      'Luồng thi thử online Ebest English — đăng ký, xác minh Zalo, làm bài và nhận kết quả.',
  },
  faq: [
    {
      question: 'Thi thử online tại Ebest gồm những gì?',
      answer:
        'Các đợt thi thử online theo chương trình Ebest (có thể gồm nhiều dạng đề). Bạn chọn bài thi phù hợp sau khi đăng ký.',
    },
    {
      question: 'Có mất phí không?',
      answer:
        'Chương trình thi thử online miễn phí theo từng đợt Ebest công bố trên trang đăng ký.',
    },
    {
      question: 'Làm sao để bắt đầu làm bài?',
      answer:
        'Đăng ký form, chọn bài thi, xác minh qua Zalo OA Ebest, sau đó làm bài trên cổng thi.',
    },
    {
      question: 'Khi nào nhận được kết quả?',
      answer:
        'Sau khi nộp bài, hệ thống chấm điểm và gửi kết quả qua Zalo và/hoặc email (nếu bạn chọn nhận qua email).',
    },
  ],
  schema: {
    enableFaqPage: true,
    enableEducationEvent: true,
    eventName: 'Thi thử online — Ebest English',
    organizerName: 'Ebest English',
  },
};

/** Khi nhúng iframe WordPress — override env (ưu tiên hơn CRM `indexable`). */
export const MOCK_TEST_ONLINE_LANDING_CANONICAL_URL =
  process.env.MOCK_TEST_ONLINE_LANDING_CANONICAL_URL?.trim() || '';
