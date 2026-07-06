/** sessionStorage keys cho luồng làm bài mock test online public. */

const AUTH_KEY = 'mock_test_online_exam_auth';



export type MockTestOnlineExamAuth = {

  registrationId: number;

  sessionId: number;

  formPublicId: string;

  omniLeadId: string;

  /** Metadata only — token thật nằm httpOnly cookie `mto_portal_auth`. */

  portalAuthorizeToken?: string;

  portalAuthorizeExpiresAt: string;

  attemptPublicId?: string;

  /** Cần cho authorize-resume — lưu sessionStorage, không phải secret quiz. */

  examSessionToken?: string;

};



export function saveMockTestOnlineExamAuth(auth: MockTestOnlineExamAuth): void {

  if (typeof window === 'undefined') return;

  const { portalAuthorizeToken: _token, ...rest } = auth;

  sessionStorage.setItem(AUTH_KEY, JSON.stringify(rest));

}



export function patchMockTestOnlineExamAuth(

  patch: Partial<MockTestOnlineExamAuth>,

): MockTestOnlineExamAuth | null {

  const current = loadMockTestOnlineExamAuth({ allowExpiredToken: true });

  if (!current) return null;

  const next = { ...current, ...patch };

  saveMockTestOnlineExamAuth(next);

  return next;

}



export function isExamAuthTokenValid(auth: MockTestOnlineExamAuth): boolean {

  const exp = Date.parse(auth.portalAuthorizeExpiresAt);

  return Number.isFinite(exp) && exp > Date.now();

}



export function isMockTestOnlineExamSessionReady(

  auth: MockTestOnlineExamAuth | null | undefined,

  opts?: { allowExpiredToken?: boolean },

): boolean {

  if (!auth) return false;

  if (

    !auth.formPublicId ||

    !Number.isFinite(auth.registrationId) ||

    !auth.omniLeadId?.trim()

  ) {

    return false;

  }

  if (!opts?.allowExpiredToken && !isExamAuthTokenValid(auth)) {

    return false;

  }

  return true;

}



export function loadMockTestOnlineExamAuth(opts?: {

  allowExpiredToken?: boolean;

}): MockTestOnlineExamAuth | null {

  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(AUTH_KEY);

  if (!raw) return null;

  try {

    const parsed = JSON.parse(raw) as MockTestOnlineExamAuth;

    if (!isMockTestOnlineExamSessionReady(parsed, opts)) {

      return null;

    }

    return parsed;

  } catch {

    return null;

  }

}



export function clearMockTestOnlineExamAuth(): void {

  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(AUTH_KEY);

}

