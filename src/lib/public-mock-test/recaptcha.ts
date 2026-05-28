const RECAPTCHA_ACTION = 'mock_test_register';

declare global {
	interface Window {
		grecaptcha?: {
			ready: (cb: () => void) => void;
			execute: (siteKey: string, options: { action: string }) => Promise<string>;
		};
	}
}

let scriptLoading: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('Chỉ chạy trên trình duyệt'));
	}
	if (window.grecaptcha) return Promise.resolve();
	if (scriptLoading) return scriptLoading;

	scriptLoading = new Promise((resolve, reject) => {
		const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY?.trim();
		if (!siteKey) {
			reject(new Error('Thiếu cấu hình reCAPTCHA.'));
			return;
		}
		const existing = document.querySelector('script[data-recaptcha-v3]');
		if (existing) {
			existing.addEventListener('load', () => resolve());
			return;
		}
		const script = document.createElement('script');
		script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
		script.async = true;
		script.defer = true;
		script.dataset.recaptchaV3 = '1';
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Không tải được reCAPTCHA.'));
		document.head.appendChild(script);
	});

	return scriptLoading;
}

export async function executeRecaptchaV3(): Promise<string> {
	const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY?.trim();
	if (!siteKey) {
		if (process.env.NODE_ENV === 'development') {
			return 'dev-bypass-token';
		}
		throw new Error('Thiếu NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY.');
	}

	await loadRecaptchaScript();

	return new Promise((resolve, reject) => {
		window.grecaptcha?.ready(() => {
			window.grecaptcha
				?.execute(siteKey, { action: RECAPTCHA_ACTION })
				.then(resolve)
				.catch(reject);
		});
	});
}
