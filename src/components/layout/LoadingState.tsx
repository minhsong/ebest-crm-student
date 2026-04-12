import { Spin } from 'antd';

interface LoadingStateProps {
  tip?: string;
  className?: string;
}

/**
 * Trạng thái đang tải – dùng khi fetch data.
 */
export function LoadingState({
  tip = 'Đang tải...',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`flex min-h-[120px] items-center justify-center py-8 ${className}`}
    >
      {/* Ant Design: `tip` chỉ hiển thị khi Spin bọc nội dung (nest), không dùng standalone */}
      <Spin tip={tip}>
        <div className="min-h-[100px] min-w-[160px]" aria-hidden />
      </Spin>
    </div>
  );
}
