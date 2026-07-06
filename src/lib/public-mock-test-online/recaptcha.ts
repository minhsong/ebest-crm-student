import { executeRecaptchaV3 } from '@/lib/public-mock-test/recaptcha';

/** reCAPTCHA action khớp Gateway intake (`mock_test_online_intake`). */
export async function executeRecaptchaMockTestOnlineIntake(): Promise<string> {
	return executeRecaptchaV3('mock_test_online_intake');
}
