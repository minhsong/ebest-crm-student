/** MIME ưu tiên ghi — thứ tự cân bằng Chrome (webm) và Safari (mp4). */
export const STUDENT_RECORDING_MIME_CANDIDATES = [
	"audio/webm;codecs=opus",
	"audio/webm",
	"audio/mp4",
] as const;

/** Trình duyệt có phát được blob local trong `<audio>` không (preview trước nộp). */
export function canPlayAudioMimeInElement(mime: string): boolean {
	if (typeof document === "undefined") return true;
	const el = document.createElement("audio");
	const base = mime.split(";")[0]?.trim() || mime;
	const hint = el.canPlayType(mime) || el.canPlayType(base);
	return hint === "probably" || hint === "maybe";
}

/**
 * Chọn MIME vừa ghi được vừa nghe preview được nếu có thể.
 * Nếu chỉ ghi được webm mà máy không phát webm, vẫn trả webm (cảnh báo ở UI).
 */
export function pickStudentRecorderMime(): string | undefined {
	if (typeof MediaRecorder === "undefined") return undefined;

	let recordableFallback: string | undefined;

	for (const candidate of STUDENT_RECORDING_MIME_CANDIDATES) {
		try {
			if (!MediaRecorder.isTypeSupported(candidate)) continue;
			if (!recordableFallback) recordableFallback = candidate;
			if (canPlayAudioMimeInElement(candidate)) return candidate;
		} catch {
			// ignore
		}
	}

	return recordableFallback;
}

/** Đẩy chunk cuối trước stop — tránh blob preview rỗng / thiếu trên một số trình duyệt. */
export function flushMediaRecorderBeforeStop(rec: MediaRecorder): void {
	if (rec.state !== "recording") return;
	try {
		rec.requestData();
	} catch {
		// ignore
	}
}

export function extensionForRecordingMime(mime: string): string {
	if (mime.includes("webm")) return "webm";
	if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
	if (mime.includes("ogg")) return "ogg";
	return "webm";
}

export function buildStudentRecordingFile(blob: Blob, mimeFallback: string): File {
	const type = blob.type || mimeFallback || "audio/webm";
	const ext = extensionForRecordingMime(type);
	const name = `ghi-am-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`;
	return new File([blob], name, { type });
}
