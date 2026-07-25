/**
 * M2M keys — Portal chỉ giữ outbound tới CRM + Gateway (mô hình A).
 */

/** Outbound → CRM inbound (`CRM_SERVICE_KEY`). Alias legacy. */
export function resolveCrmServiceKey(): string {
  return (
    process.env.CRM_SERVICE_KEY?.trim() ||
    process.env.SOCIAL_GATEWAY_SERVICE_TOKEN?.trim() ||
    process.env.STUDENT_PORTAL_BFF_REPORT_KEY?.trim() ||
    process.env.PUBLIC_REG_SERVER_TOKEN?.trim() ||
    ''
  );
}

/** Outbound → Gateway inbound (`GATEWAY_SERVICE_KEY`). Alias legacy. */
export function resolveGatewayServiceKey(): string {
  return (
    process.env.GATEWAY_SERVICE_KEY?.trim() ||
    process.env.SOCIAL_GATEWAY_SERVICE_TOKEN?.trim() ||
    process.env.CRM_SERVICE_TOKEN?.trim() ||
    ''
  );
}
