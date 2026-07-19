export type LeadCreateAccountFormValues = {
  displayName?: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LeadCreateAccountMode = "self-serve" | "proof";

export type LeadCreateAccountEntryMode =
  "choose" | "email" | "google_complete" | "google_password_link";

export type LeadCreateAccountDoneState = {
  email: string;
  emailVerificationSent: boolean;
  message: string;
};
