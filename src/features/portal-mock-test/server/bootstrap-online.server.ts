import {
  buildGatewayServiceHeaders,
  getSocialGatewayConfig,
} from '@/lib/social-gateway-bff.util';
import type {
  PortalMockTestCustomerPrincipal,
  PortalMockTestLeadPrincipal,
} from '../identity/types';

export type OnlineBootstrapResult =
  | { ok: true; pendingLeadId: string }
  | { ok: false; status: number; message: string; attemptLimit?: boolean };

function mapBootstrapFailure(
  res: Response,
  data: { message?: string },
): OnlineBootstrapResult {
  if (res.status === 403) {
    return {
      ok: false,
      status: 403,
      message:
        typeof data.message === 'string'
          ? data.message
          : 'Bạn đã hết lượt thi cho loại đề này.',
      attemptLimit: true,
    };
  }
  return {
    ok: false,
    status: res.status || 502,
    message:
      typeof data.message === 'string'
        ? data.message
        : 'Không khởi tạo được phiên thi. Vui lòng thử lại.',
  };
}

async function postGatewayBootstrap(
  path: string,
): Promise<OnlineBootstrapResult> {
  const cfg = getSocialGatewayConfig();
  if (!cfg) {
    return {
      ok: false,
      status: 500,
      message: 'Cấu hình gateway chưa đúng.',
    };
  }

  const url = `${cfg.baseUrl}/api/v1/internal/mock-test-online/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildGatewayServiceHeaders(cfg),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as {
    pendingLeadId?: string;
    message?: string;
  };

  const pendingLeadId = data.pendingLeadId?.trim();
  if (!res.ok || !pendingLeadId) {
    return mapBootstrapFailure(res, data);
  }

  return { ok: true, pendingLeadId };
}

/** Lead fast path — GW bootstrap-lead-pending từ omniLeadId. */
export async function bootstrapLeadOnlineSession(
  principal: PortalMockTestLeadPrincipal,
): Promise<OnlineBootstrapResult> {
  return postGatewayBootstrap(
    `leads/${encodeURIComponent(principal.omniLeadId)}/bootstrap-lead-pending`,
  );
}

/** HV fast path — GW bootstrap-customer-pending từ customerId (P4). */
export async function bootstrapCustomerOnlineSession(
  principal: PortalMockTestCustomerPrincipal,
): Promise<OnlineBootstrapResult> {
  return postGatewayBootstrap(
    `customers/${principal.customerId}/bootstrap-customer-pending`,
  );
}

export async function bootstrapPortalOnlineSession(
  principal: PortalMockTestLeadPrincipal | PortalMockTestCustomerPrincipal,
): Promise<OnlineBootstrapResult> {
  if (principal.actor === 'customer') {
    return bootstrapCustomerOnlineSession(principal);
  }
  return bootstrapLeadOnlineSession(principal);
}
