'use client';

import { useCallback, useEffect, useState } from 'react';
import { Table, Button } from 'antd';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { PageHeader, PageCard } from '@/components/layout';

interface InvoiceItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  status: number;
  paymentStatus: number;
  totalAmount: number;
  paidAmount?: number;
  currency?: string;
}

export default function InvoicesPage() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ data: InvoiceItem[]; pagination: { total: number } }>({
    data: [],
    pagination: { total: 0 },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/invoices');
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.data) {
        setData({
          data: json.data,
          pagination: json.pagination ?? { total: json.data?.length ?? 0 },
        });
      } else {
        setData({ data: [], pagination: { total: 0 } });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load]);

  const formatMoney = (n: number, currency?: string) =>
    `${Number(n).toLocaleString('vi-VN')} ${currency ?? 'VND'}`;

  const columns = [
    { title: 'Số HĐ', dataIndex: 'invoiceNumber', key: 'invoiceNumber', width: 140 },
    { title: 'Ngày', dataIndex: 'invoiceDate', key: 'invoiceDate', width: 110 },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number, r: InvoiceItem) => formatMoney(v, r.currency),
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (v: number, r: InvoiceItem) => formatMoney(v ?? 0, r.currency),
    },
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_: unknown, row: InvoiceItem) => (
        <Link href={`/invoices/${row.id}`}>
          <Button type="link" size="small">
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Hóa đơn"
        description="Tra cứu hóa đơn và thanh toán của bạn."
      />
      <PageCard noPadding>
        <Table
          loading={loading}
          dataSource={data.data}
          columns={columns}
          rowKey="id"
          pagination={{
            total: data.pagination.total,
            pageSize: 20,
            showSizeChanger: false,
          }}
          locale={{ emptyText: 'Chưa có hóa đơn.' }}
        />
      </PageCard>
    </>
  );
}
