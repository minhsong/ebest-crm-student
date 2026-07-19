import Link from "next/link";
import { Alert, Button, Space } from "antd";

import { LeadPortalShell } from "./LeadPortalShell";

export function LeadCreateAccountUnavailableView() {
  return (
    <LeadPortalShell
      title="Không tìm thấy thông tin đăng ký"
      description="Vui lòng đăng ký thi thử trước, sau đó tạo tài khoản từ liên kết trên trang xác nhận."
    >
      <Alert
        type="warning"
        showIcon
        className="mb-4"
        message="Thiếu mã đăng ký thi thử"
      />
      <Space wrap>
        <Link href="/register">
          <Button type="primary">Đăng ký tài khoản</Button>
        </Link>
        <Link href="/mock-test-online/register">
          <Button>Thi thử online</Button>
        </Link>
      </Space>
    </LeadPortalShell>
  );
}
