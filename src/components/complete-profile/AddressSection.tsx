'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';
import { formRules, FIELD_LIMITS } from '@/lib/complete-profile';
import { stripAddressPrefix } from '@/lib/address-utils';

export interface ProvinceOption {
  name: string;
  code: number;
  codename: string;
}

export interface WardOption {
  name: string;
  code: number;
  codename: string;
}

interface AddressSectionProps {
  form: FormInstance;
  initialStreetAddress?: string;
  initialProvinceCode?: number;
  initialProvinceName?: string;
  initialProvinceCodename?: string;
  initialWardCode?: number;
  initialWardName?: string;
  initialWardCodename?: string;
}

export function AddressSection({
  form,
  initialStreetAddress,
  initialProvinceCode,
  initialProvinceName,
  initialProvinceCodename,
  initialWardCode,
  initialWardName,
  initialWardCodename,
}: AddressSectionProps) {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingProvinces(true);
    fetch('/api/vietnam-administrative/provinces')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          setProvinces([]);
          return;
        }
        const list = Array.isArray(data) ? data : data?.result ?? data?.data ?? [];
        if (Array.isArray(list)) {
          setProvinces(list as ProvinceOption[]);
        } else {
          setProvinces([]);
        }
      })
      .catch(() => {
        if (mounted) setProvinces([]);
      })
      .finally(() => {
        if (mounted) setLoadingProvinces(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const provinceCode = Form.useWatch('provinceCode', form);
  const provinceOption = provinces.find((p) => p.code === provinceCode);

  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    let mounted = true;
    setLoadingWards(true);
    fetch(`/api/vietnam-administrative/provinces/${provinceCode}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          setWards([]);
          return;
        }
        // Proxy returns { name, code, codename, wards } (or wrapped in result)
        const payload = data?.result ?? data;
        const list = payload?.wards;
        if (Array.isArray(list)) {
          setWards(list as WardOption[]);
        } else {
          setWards([]);
        }
      })
      .catch(() => {
        if (mounted) setWards([]);
      })
      .finally(() => {
        if (mounted) setLoadingWards(false);
      });
    return () => {
      mounted = false;
    };
  }, [provinceCode]);

  const handleProvinceChange = useCallback(
    (code: number | undefined) => {
      if (code === undefined) {
        form.setFieldsValue({
          provinceCode: undefined,
          provinceName: undefined,
          provinceCodename: undefined,
          wardCode: undefined,
          wardName: undefined,
          wardCodename: undefined,
        });
        setWards([]);
        return;
      }
      const option = provinces.find((p) => p.code === code);
      if (option) {
        form.setFieldsValue({
          provinceCode: option.code,
          provinceName: option.name,
          provinceCodename: option.codename,
          wardCode: undefined,
          wardName: undefined,
          wardCodename: undefined,
        });
      }
    },
    [form, provinces]
  );

  /** Filter không phân biệt hoa thường, tìm theo tên (đã bỏ tiền tố) và mã code */
  const filterOptionByLabelAndCode = useCallback(
    (input: string, option: { label?: string; value?: number }) => {
      const q = (input || '').trim().toLowerCase();
      if (!q) return true;
      const label = String(option?.label ?? '').toLowerCase();
      const code = String(option?.value ?? '').toLowerCase();
      return label.includes(q) || code.includes(q);
    },
    []
  );

  const handleWardChange = useCallback(
    (code: number | undefined) => {
      if (code === undefined) {
        form.setFieldsValue({ wardCode: undefined, wardName: undefined, wardCodename: undefined });
        return;
      }
      const option = wards.find((w) => w.code === code);
      if (option) {
        form.setFieldsValue({
          wardCode: option.code,
          wardName: option.name,
          wardCodename: option.codename,
        });
      }
    },
    [form, wards]
  );

  useEffect(() => {
    if (provinces.length === 0) return;
    const current = form.getFieldValue('provinceCode');
    if (current != null) return;
    const byCode = initialProvinceCode && provinces.find((p) => p.code === initialProvinceCode);
    const byCodename = initialProvinceCodename && provinces.find((p) => p.codename === initialProvinceCodename);
    const p = byCode ?? byCodename;
    if (p) {
      form.setFieldsValue({
        provinceCode: p.code,
        provinceName: p.name,
        provinceCodename: p.codename,
      });
    }
  }, [initialProvinceCode, initialProvinceCodename, provinces, form]);

  useEffect(() => {
    if (wards.length === 0) return;
    const current = form.getFieldValue('wardCode');
    if (current != null) return;
    const byCode = initialWardCode && wards.find((w) => w.code === initialWardCode);
    const byCodename = initialWardCodename && wards.find((w) => w.codename === initialWardCodename);
    const w = byCode ?? byCodename;
    if (w) {
      form.setFieldsValue({
        wardCode: w.code,
        wardName: w.name,
        wardCodename: w.codename,
      });
    }
  }, [initialWardCode, initialWardCodename, wards, form]);

  return (
    <div className="space-y-4">
      <Form.Item
        name="streetAddress"
        label="Số nhà, tên đường"
        rules={formRules.streetAddress}
        initialValue={initialStreetAddress}
      >
        <Input.TextArea
          placeholder="VD: 123 Nguyễn Huệ"
          rows={2}
          maxLength={FIELD_LIMITS.streetAddress}
          showCount
        />
      </Form.Item>
      <Form.Item name="provinceCode" label="Tỉnh/Thành phố" initialValue={initialProvinceCode}>
        <Select
          showSearch
          placeholder="Chọn tỉnh/thành phố"
          loading={loadingProvinces}
          allowClear
          optionLabelProp="label"
          options={provinces.map((p) => ({
            label: stripAddressPrefix(p.name),
            value: p.code,
          }))}
          filterOption={filterOptionByLabelAndCode}
          onChange={handleProvinceChange}
          value={provinceCode ?? undefined}
        />
      </Form.Item>
      <Form.Item name="wardCode" label="Phường/Xã" initialValue={initialWardCode}>
        <Select
          showSearch
          placeholder="Chọn phường/xã"
          loading={loadingWards}
          allowClear
          disabled={!provinceCode || wards.length === 0}
          optionLabelProp="label"
          options={wards.map((w) => ({
            label: stripAddressPrefix(w.name),
            value: w.code,
          }))}
          filterOption={filterOptionByLabelAndCode}
          onChange={handleWardChange}
        />
      </Form.Item>
      {/* Hidden fields for payload (name/codename) */}
      <Form.Item name="provinceName" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="provinceCodename" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="wardName" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="wardCodename" hidden>
        <input type="hidden" />
      </Form.Item>
    </div>
  );
}
