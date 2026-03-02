'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Descriptions, Button } from 'antd';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { PageCard } from '@/components/layout';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/invoices/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'Không tải được hóa đơn.');
        setInvoice(null);
        return;
      }
      setInvoice(data);
    } finally {
      setLoading(false);
    }
  }, [id, fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-gray-500">Đang tải...</p>;
  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error ?? 'Hóa đơn không tồn tại.'}</p>
        <Link href="/invoices">
          <Button>Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const totalAmount = Number(invoice.totalAmount ?? 0);
  const paidAmount = Number(invoice.paidAmount ?? 0);
  const currency = (invoice.currency as string) ?? 'VND';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">
          Hóa đơn #{invoice.invoiceNumber as string}
        </h1>
        <Link href="/invoices">
          <Button>Quay lại</Button>
        </Link>
      </div>
      <PageCard>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Số hóa đơn">{invoice.invoiceNumber as string}</Descriptions.Item>
          <Descriptions.Item label="Ngày">{invoice.invoiceDate as string}</Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">
            {totalAmount.toLocaleString('vi-VN')} {currency}
          </Descriptions.Item>
          <Descriptions.Item label="Đã thanh toán">
            {paidAmount.toLocaleString('vi-VN')} {currency}
          </Descriptions.Item>
        </Descriptions>
      </PageCard>
    </div>
  );
}
