/** Trang landing WordPress nhúng iframe — canonical SEO chính. */
export const MOCK_TEST_LANDING_CANONICAL_URL =
	process.env.MOCK_TEST_LANDING_CANONICAL_URL?.trim() ||
	'https://ebest.edu.vn/thi-thu-toeic-mien-phi-chuan-format-iig-moi-nhat-offline-da-nang/';

export const MOCK_TEST_LANDING_SEO = {
	title: 'Đăng ký thi thử TOEIC 2 kỹ năng Offline | EBest Đà Nẵng',
	description:
		'Form đăng ký thi thử TOEIC Listening & Reading offline tại trung tâm EBest Đà Nẵng — dành cho học sinh, sinh viên. Chọn cơ sở, lịch thi và điền thông tin nhanh.',
	/** Copy hiển thị trên widget (iframe). */
	widgetTitle: 'Đăng ký thi thử TOEIC 2 kỹ năng (Offline)',
	widgetIntro:
		'Thi thử TOEIC L&R tại trung tâm EBest Đà Nẵng — format chuẩn IIG. Dành cho học sinh, sinh viên muốn đánh giá trình độ trước khi thi chính thức. Chọn cơ sở, lịch thi và điền thông tin bên dưới.',
} as const;
