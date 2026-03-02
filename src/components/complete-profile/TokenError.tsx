import { Alert } from 'antd';
import { PageCard } from '@/components/layout';
import { APP_BRAND, FANPAGE_URL } from '@/lib/ui-constants';

interface TokenErrorProps {
  message: string;
}

export function TokenError({ message }: TokenErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <PageCard className="w-full max-w-md">
        <Alert
          type="error"
          showIcon
          message="Link không hợp lệ"
          description={
            <div className="mt-2">
              <p>{message}</p>
              <p className="mt-3 text-neutral-600">
                Nếu bạn cần link mới, vui lòng liên hệ trung tâm {APP_BRAND}{' '}
                hoặc nhắn tin qua{' '}
                <a href={FANPAGE_URL} target="_blank" rel="noopener noreferrer">
                  Fanpage E-best English
                </a>
                .
              </p>
            </div>
          }
        />
      </PageCard>
    </div>
  );
}
