import {
  sanitizeStudentFacingMessage,
  studentMessageForHttpStatus,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import {
  appendMockTestQuizAuthToUrl,
  enrichMockTestQuizAuthBody,
  isMockTestOnlineQuizRuntimeUrl,
} from '@/lib/public-mock-test-online/inject-quiz-auth';
import { refreshMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-auth-refresh.client';
import { loadMockTestOnlineExamAuth, isMockTestOnlineExamSessionReady } from '@/lib/public-mock-test-online/exam-session';

async function retryMockTestQuizRequest(
  url: string,
  init: RequestInit | undefined,
): Promise<Response> {
  const hint = loadMockTestOnlineExamAuth({ allowExpiredToken: true });
  if (!hint?.registrationId) {
    return new Response(JSON.stringify({ message: 'Phiên làm bài hết hạn.' }), {
      status: 401,
    });
  }
  const refreshed = await refreshMockTestOnlineExamAuth(hint.registrationId);
  if (!refreshed || !isMockTestOnlineExamSessionReady(refreshed)) {
    return new Response(JSON.stringify({ message: 'Phiên làm bài hết hạn.' }), {
      status: 401,
    });
  }
  let retryUrl = url;
  let retryInit = init;
  retryUrl = appendMockTestQuizAuthToUrl(url);
  const method = init?.method?.toUpperCase() ?? 'GET';
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    retryInit = {
      ...init,
      body: enrichMockTestQuizAuthBody(init?.body ?? {}),
    };
  }
  return fetch(retryUrl, {
    credentials: 'include',
    ...retryInit,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(retryInit?.headers ?? {}),
    },
  });
}

export async function fetchQuizRuntimeJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T }> {
  let requestUrl = url;
  let requestInit = init;
  if (isMockTestOnlineQuizRuntimeUrl(url)) {
    requestUrl = appendMockTestQuizAuthToUrl(url);
    const method = init?.method?.toUpperCase() ?? 'GET';
    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      requestInit = {
        ...init,
        body: enrichMockTestQuizAuthBody(init?.body ?? {}),
      };
    }
  }
  const res = await fetch(requestUrl, {
    credentials: 'include',
    ...requestInit,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(requestInit?.headers ?? {}),
    },
  });
  if (
    res.status === 401 &&
    isMockTestOnlineQuizRuntimeUrl(url)
  ) {
    const retryRes = await retryMockTestQuizRequest(url, init);
    const retryData = (await retryRes.json().catch(() => ({}))) as T;
    return { ok: retryRes.ok, status: retryRes.status, data: retryData };
  }
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

/** Lấy message hiển thị từ body API quiz — không hiện HTTP status / chi tiết server. */
export function quizRuntimeErrorMessage(
  status: number,
  data: unknown,
  context: 'load' | 'submit' | 'start' | 'generic' = 'generic',
): string {
  const contextFallback =
    context === 'load'
      ? STUDENT_SAFE_USER_MESSAGES.quizLoadFailed
      : context === 'submit'
        ? STUDENT_SAFE_USER_MESSAGES.quizSubmitFailed
        : context === 'start'
          ? 'Không bắt đầu được bài thi. Vui lòng thử lại.'
          : STUDENT_SAFE_USER_MESSAGES.quizUnavailable;
  const statusFallback = studentMessageForHttpStatus(status);
  const fallback =
    status >= 500 || status === 503 ? statusFallback : contextFallback;

  if (data && typeof data === 'object' && data !== null) {
    const payload = data as { message?: unknown; errorCode?: unknown; code?: unknown };
    const codeRaw =
      typeof payload.errorCode === 'string'
        ? payload.errorCode
        : typeof payload.code === 'string'
          ? payload.code
          : undefined;
    const code = codeRaw?.trim();
    if (code) {
      const mapped = mapQuizStartErrorCode(code);
      if (mapped) return mapped;
    }
    if (typeof payload.message === 'string') {
      return sanitizeStudentFacingMessage(payload.message, fallback);
    }
  }
  return fallback;
}

/** Map mã nghiệp vụ mock-test / quiz start → câu người dùng hiểu. */
function mapQuizStartErrorCode(code: string): string | null {
  switch (code) {
    case 'ENTITLEMENT_CONSUME_FAILED':
      return 'Chưa bắt đầu được bài thi. Thử lại; nếu vẫn lỗi hãy tải lại trang hoặc liên hệ Ebest.';
    case 'ENTITLEMENT_UNAVAILABLE':
      return 'Tạm thời chưa mở được bài thi. Vui lòng thử lại sau ít phút.';
    case 'ACCESS_DENIED':
    case 'MAX_ATTEMPTS_EXCEEDED':
      return 'Bạn đã dùng hết lượt thi thử online cho loại đề này.';
    case 'CHANNEL_ALREADY_CONSUMED':
      return 'Lượt xác minh này đã được dùng. Liên hệ Ebest nếu cần hỗ trợ.';
    case 'EXAM_SESSION_EXPIRED':
      return 'Hết thời gian làm bài. Không thể tiếp tục phiên này.';
    case 'ATTEMPT_EXPIRED':
      return 'Hết hạn vào phòng thi. Vui lòng chọn lại bài thi nếu vẫn muốn thi.';
    case 'EXAM_ALREADY_COMPLETED':
      return 'Bạn đã hoàn thành bài thi này.';
    case 'ZALO_VERIFICATION_REQUIRED':
      return 'Bạn cần hoàn tất xác minh Zalo trước khi bắt đầu.';
    case 'RATE_LIMITED':
      return 'Thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.';
    default:
      return null;
  }
}
