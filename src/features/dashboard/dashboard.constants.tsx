import {
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

export const DASHBOARD_QUICK_LINKS = [
  {
    href: '/classes',
    icon: <BookOutlined className="text-2xl text-blue-600" />,
    iconBg: 'bg-blue-100',
    title: 'Lớp học của tôi',
    description: 'Xem danh sách lớp đang học và lịch cố định',
  },
  {
    href: '/schedule',
    icon: <CalendarOutlined className="text-2xl text-cyan-600" />,
    iconBg: 'bg-cyan-100',
    title: 'Lịch học',
    description: 'Buổi học theo ngày — giờ, phòng, bài học',
  },
  {
    href: '/invoices',
    icon: <FileTextOutlined className="text-2xl text-green-600" />,
    iconBg: 'bg-green-100',
    title: 'Hóa Đơn',
    description: 'Tra cứu hóa đơn và thanh toán',
  },
] as const;
