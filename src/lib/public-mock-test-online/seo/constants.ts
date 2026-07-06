import type { MockTestOnlineSeoConfig } from './types';

/** Fallback khi CRM chưa phản hồi — đồng bộ default CRM `mock_test_online_seo`. */
export const MOCK_TEST_ONLINE_SEO_FALLBACK: MockTestOnlineSeoConfig = {
  landing: {
    indexable: true,
    title: 'Thi thử TOEIC online miễn phí — Listening & Reading | Ebest English',
    description:
      'Đăng ký thi thử TOEIC L&R online miễn phí tại Ebest English — format gần kỳ thi IIG. Xác minh Zalo, làm bài trên máy tính hoặc điện thoại, nhận kết quả qua Zalo và email.',
    canonicalUrl: '',
    ogImagePath: '/og-image.png',
    widgetTitle: 'Đăng ký thi thử TOEIC online miễn phí',
    widgetIntro:
      'Điền thông tin bên dưới. Sau khi gửi, bạn sẽ được hướng dẫn xác minh qua Zalo OA Ebest để nhận mã làm bài.',
  },
  embed: {
    title: 'Thi thử TOEIC online — Ebest English',
    description:
      'Luồng thi thử TOEIC online Ebest English — xác minh Zalo, làm bài và nhận kết quả.',
  },
  faq: [
    {
      question: 'Thi thử TOEIC online tại Ebest gồm những gì?',
      answer:
        'Bài thi TOEIC Listening & Reading (2 kỹ năng) trên nền tảng online, format gần với kỳ thi IIG.',
    },
    {
      question: 'Có mất phí không?',
      answer:
        'Chương trình thi thử online miễn phí theo từng đợt Ebest công bố trên trang đăng ký.',
    },
    {
      question: 'Làm sao để bắt đầu làm bài?',
      answer:
        'Đăng ký form, xác minh qua Zalo OA Ebest, sau đó nhập mã làm bài trên cổng thi.',
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
    eventName: 'Thi thử TOEIC online — Ebest English',
    organizerName: 'Ebest English',
  },
};

/** Khi nhúng iframe WordPress — override env (ưu tiên hơn CRM `indexable`). */
export const MOCK_TEST_ONLINE_LANDING_CANONICAL_URL =
  process.env.MOCK_TEST_ONLINE_LANDING_CANONICAL_URL?.trim() || '';
