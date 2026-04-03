'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, Empty, Flex, Typography, theme } from 'antd';
import type { OverviewClassSessions } from '@/types/overview-sessions';
import {
  addDays,
  groupSessionsByWeekDay,
  startOfWeekMonday,
  toYyyyMmDd,
  flattenSessionsWithClass,
} from '@/lib/dashboard-schedule-helpers';
import { StudentWeekSessionCell } from '@/features/dashboard/components/StudentWeekSessionCell';

const { Text, Title } = Typography;

const VI_DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export type StudentWeekScheduleProps = {
  sessionsByClass: OverviewClassSessions[];
};

export function StudentWeekSchedule({ sessionsByClass }: StudentWeekScheduleProps) {
  const { token } = theme.useToken();
  const weekStart = useMemo(() => startOfWeekMonday(), []);
  const todayYmd = useMemo(() => toYyyyMmDd(new Date()), []);

  const { dayKeys, byDay, totalInWeek } = useMemo(() => {
    const flat = flattenSessionsWithClass(sessionsByClass);
    const grouped = groupSessionsByWeekDay(flat, weekStart);
    const keys: string[] = [];
    for (let i = 0; i < 7; i++) {
      keys.push(toYyyyMmDd(addDays(weekStart, i)));
    }
    let n = 0;
    for (const k of keys) {
      n += grouped.get(k)?.length ?? 0;
    }
    return { dayKeys: keys, byDay: grouped, totalInWeek: n };
  }, [sessionsByClass, weekStart]);

  const rangeLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    const short = (d: Date) =>
      `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const full = (d: Date) => `${short(d)}/${d.getFullYear()}`;
    const sameY = weekStart.getFullYear() === end.getFullYear();
    const sameM = sameY && weekStart.getMonth() === end.getMonth();
    if (sameM) {
      return `${weekStart.getDate().toString().padStart(2, '0')} – ${full(end)}`;
    }
    if (sameY) {
      return `${short(weekStart)} – ${full(end)}`;
    }
    return `${full(weekStart)} – ${full(end)}`;
  }, [weekStart]);

  const gridTemplateColumns = useMemo(() => {
    return dayKeys
      .map((key) => {
        const count = byDay.get(key)?.length ?? 0;
        return count === 0 ? 'minmax(50px, max-content)' : 'minmax(300px, 1fr)';
      })
      .join(' ');
  }, [dayKeys, byDay]);

  const gridMinWidthPx = useMemo(() => {
    let sum = 0;
    for (const key of dayKeys) {
      sum += (byDay.get(key)?.length ?? 0) === 0 ? 50 : 300;
    }
    return sum;
  }, [dayKeys, byDay]);

  return (
    <Card
      size="small"
      title={
        <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
          <Title level={5} style={{ margin: 0 }}>
            Lịch học tuần này
          </Title>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {rangeLabel}
          </Text>
        </Flex>
      }
      extra={
        <Link href="/schedule" style={{ color: token.colorLink, fontSize: token.fontSizeSM }}>
          Lịch học
        </Link>
      }
      styles={{
        body: { padding: token.padding },
      }}
    >
      {totalInWeek === 0 ? (
        <Empty
          description="Không có buổi học nào trong tuần này."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div style={{ overflowX: 'auto', margin: `0 -${token.marginXXS}px` }}>
          <div
            style={{
              padding: `0 ${token.marginXXS}px`,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns,
                gap: 0,
                minWidth: gridMinWidthPx,
                border: `1px solid ${token.colorSplit}`,
                borderRadius: token.borderRadius,
                overflow: 'hidden',
                background: token.colorFillAlter,
              }}
            >
            {dayKeys.map((dateKey, i) => {
              const d = addDays(weekStart, i);
              const header = `${VI_DOW[i]} ${d.getDate()}/${d.getMonth() + 1}`;
              const list = byDay.get(dateKey) ?? [];
              const isToday = dateKey === todayYmd;
              return (
                <Flex
                  key={dateKey}
                  vertical
                  gap={0}
                  style={{
                    minWidth: 0,
                    position: 'relative',
                    borderRight:
                      i < dayKeys.length - 1
                        ? `1px solid ${token.colorSplit}`
                        : undefined,
                    background: isToday ? token.colorPrimaryBg : token.colorBgContainer,
                    boxSizing: 'border-box',
                    boxShadow: isToday
                      ? `inset 0 0 0 2px ${token.colorPrimary}`
                      : undefined,
                  }}
                >
                  {isToday ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: token.colorPrimary,
                        zIndex: 1,
                      }}
                      aria-hidden
                    />
                  ) : null}
                  <div
                    style={{
                      paddingTop: isToday ? 5 : token.paddingSM,
                      paddingBottom: token.paddingSM,
                      paddingInline: token.paddingXS,
                      borderBottom: `1px solid ${isToday ? token.colorPrimaryBorder : token.colorSplit}`,
                      background: isToday ? token.colorPrimaryBg : token.colorFillAlter,
                      textAlign: 'center',
                    }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: 12,
                        color: isToday ? token.colorPrimary : token.colorText,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {header}
                    </Text>
                  </div>
                  <Flex
                    vertical
                    gap={8}
                    style={{
                      padding: token.paddingXS,
                      minHeight: list.length === 0 ? 0 : 48,
                      flex: 1,
                    }}
                  >
                    {list.map((item) => (
                      <StudentWeekSessionCell
                        key={`${item.classId}-${item.row.sessionId}`}
                        item={item}
                      />
                    ))}
                  </Flex>
                </Flex>
              );
            })}
            </div>
          </div>
        </div>
      )}
      <Text
        type="secondary"
        style={{
          display: 'block',
          marginTop: token.marginSM,
          fontSize: token.fontSizeSM,
        }}
      >
        Bấm vào buổi học để mở trang Lịch học đầy đủ.
      </Text>
    </Card>
  );
}
