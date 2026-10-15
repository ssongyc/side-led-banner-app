export class ConsentBlockedError extends Error {}
const state = { allowed: false, required: false, busy: false, revision: 0 };
export const getAdConsent = () => state;
export const isAdConsentAllowed = () => false;
export const subscribeAdConsent = (_listener: () => void) => () => {};
export const useAdConsent = () => state;
export async function ensureAdConsent(): Promise<void> { throw new ConsentBlockedError('Native advertising is unavailable on web.'); }
export async function showAdPrivacy(): Promise<void> {}
export function ConsentBannerAd(_props: unknown) { return null; }
export function AdPrivacyOptions(_props: { language: string; color?: string }) { return null; }

export const registerConsentLifecycle = (_guard: () => boolean, _invalidate: () => void) => () => {};
