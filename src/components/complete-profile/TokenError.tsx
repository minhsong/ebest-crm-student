import { Alert, Card } from 'antd';

interface TokenErrorProps {
  message: string;
}

export function TokenError({ message }: TokenErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-sm">
        <Alert
          type="error"
          showIcon
          message="Link không hợp lệ"
          description={
            <div className="mt-2">
              <p>{message}</p>
              <p className="mt-3 text-neutral-600">
                Nếu bạn cần link mới, vui lòng liên hệ trung tâm Ebest English
                hoặc nhắn tin qua Fanpage E-best English.
              </p>
            </div>
          }
        />
      </Card>
    </div>
  );
}
