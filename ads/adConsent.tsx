import React, { useSyncExternalStore } from 'react';
import { AppState, Platform, Pressable, Text, useColorScheme } from 'react-native';
import type { BannerAdProps } from 'react-native-google-mobile-ads';

type State = { allowed: boolean; required: boolean; busy: boolean; revision: number };
let state: State = { allowed: false, required: false, busy: false, revision: 0 };
const listeners = new Set<() => void>();
let startup: Promise<void> | undefined;
let qaConsentReset = false;
let privacy: Promise<void> | undefined;
const privacyGuards = new Set<() => boolean>();
const invalidators = new Set<() => void>();
export function registerConsentLifecycle(canPresent: () => boolean, invalidate: () => void) {
  privacyGuards.add(canPresent); invalidators.add(invalidate);
  return () => { privacyGuards.delete(canPresent); invalidators.delete(invalidate); };
}
const nativeSdk = () => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') throw new ConsentBlockedError('Ads are unavailable on this platform.');
  // Keep native registration errors inside the consent request's failure boundary.
  // Metro still selects adConsent.web.tsx for web.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
};
export class ConsentBlockedError extends Error {}
export const getAdConsent = () => state;
export const isAdConsentAllowed = () => state.allowed && !state.busy;
export const subscribeAdConsent = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const useAdConsent = () => useSyncExternalStore(subscribeAdConsent, getAdConsent, getAdConsent);
function publish(patch: Partial<State>) { state = { ...state, ...patch }; listeners.forEach(listener => listener()); }
async function refresh() {
  const info = await nativeSdk().AdsConsent.getConsentInfo();
  publish({ allowed: info.canRequestAds, required: info.privacyOptionsRequirementStatus === nativeSdk().AdsConsentPrivacyOptionsRequirementStatus.REQUIRED });
}
async function foreground() {
  if (AppState.currentState === 'active') return;
  await new Promise<void>(resolve => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') { subscription.remove(); resolve(); }
    });
  });
}
// Once per process, shared by root preload, Settings and every placement.
export async function ensureAdConsent(): Promise<void> {
  startup ??= (async () => {
    publish({ busy: true });
    try {
      await foreground();
      const qaDevice = process.env.EXPO_PUBLIC_UMP_EEA_TEST_DEVICE;
      const sdk = nativeSdk();
      if (qaDevice && qaDevice !== 'disabled') {
        if (!/^[A-Fa-f0-9]{32}$/.test(qaDevice)) throw new Error('Invalid UMP QA device identifier.');
        // Reset once per process; an approved manual recovery must not reset again.
        if (!qaConsentReset) {
          qaConsentReset = true;
          sdk.AdsConsent.reset();
        }
        await sdk.AdsConsent.requestInfoUpdate({
          debugGeography: sdk.AdsConsentDebugGeography.EEA,
          testDeviceIdentifiers: [qaDevice],
        });
      } else {
        await sdk.AdsConsent.requestInfoUpdate();
      }
      await foreground();
      await nativeSdk().AdsConsent.loadAndShowConsentFormIfRequired();
    } catch (error) {
      console.warn('[UMP] Consent update/form failed', error);
    } finally {
      try { await refresh(); }
      catch (error) { publish({ allowed: false }); console.warn('[UMP] Consent status failed', error); }
      publish({ busy: false });
    }
  })();
  await startup;
  if (!isAdConsentAllowed()) throw new ConsentBlockedError('UMP does not permit ad requests.');
}
export function showAdPrivacy(): Promise<void> {
  if (privacy) return privacy;
  if (!state.required || state.busy || [...privacyGuards].some(guard => !guard()) || AppState.currentState !== 'active') return Promise.resolve();
  publish({ busy: true, revision: state.revision + 1 });
  privacy = (async () => {
    // Give subscribed banner views time to detach before presenting the native form.
    try {
      invalidators.forEach(invalidate => invalidate());
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await foreground(); await nativeSdk().AdsConsent.showPrivacyOptionsForm();
    }
    catch (error) { console.warn('[UMP] Privacy options failed', error); }
    finally {
      try { await refresh(); }
      catch (error) { publish({ allowed: false }); console.warn('[UMP] Consent status failed', error); }
      publish({ busy: false });
    }
  })().finally(() => { privacy = undefined; });
  return privacy;
}
export class ConsentBannerAd extends React.Component<BannerAdProps, { consent: State; cancelled: boolean }> {
  state = { consent: getAdConsent(), cancelled: false };
  private issued = false;
  private loaded = false;
  private unsubscribe?: () => void;
  private syncConsent = () => {
    const consent = getAdConsent();
    const blocked = !consent.allowed || consent.busy;
    const cancelled = this.state.cancelled || (blocked && this.issued && !this.loaded);
    if (blocked) this.issued = false;
    this.setState({ consent, cancelled });
  };
  private markIssued() {
    const { consent, cancelled } = this.state;
    if (consent.allowed && !consent.busy && !cancelled && !this.issued) {
      this.issued = true;
      this.loaded = false;
    }
  }
  componentDidMount() {
    this.markIssued();
    this.unsubscribe = subscribeAdConsent(this.syncConsent);
    if (this.state.consent !== getAdConsent()) this.syncConsent();
  }
  componentDidUpdate() { this.markIssued(); }
  componentWillUnmount() { this.unsubscribe?.(); }
  render() {
    const { consent, cancelled } = this.state;
    // Unknown cancelled requests remain stopped until the placement explicitly replaces this instance.
    if (!consent.allowed || consent.busy || cancelled) return null;
    const revision = consent.revision;
    const Banner = nativeSdk().BannerAd;
    return <Banner {...this.props} onAdLoaded={size => {
      if (!isAdConsentAllowed() || getAdConsent().revision !== revision) return;
      this.loaded = true; this.props.onAdLoaded?.(size);
    }} onAdFailedToLoad={error => {
      if (!isAdConsentAllowed() || getAdConsent().revision !== revision) return;
      this.props.onAdFailedToLoad?.(error);
    }} />;
  }
}
const labels: Record<string, string> = {
  en: 'Ad privacy choices', ko: '광고 개인정보 설정', ja: '広告のプライバシー設定',
  'zh-Hans': '广告隐私设置', 'zh-Hant': '廣告隱私設定', fr: 'Confidentialité des annonces', es: 'Privacidad de los anuncios',
};
const aliases: Record<string, string> = { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant', sc: 'zh-Hans', tc: 'zh-Hant', zhSC: 'zh-Hans', zhTC: 'zh-Hant', English: 'en', Korean: 'ko', Japanese: 'ja', ChineseSimplified: 'zh-Hans', ChineseTraditional: 'zh-Hant', 'Français': 'fr', 'Español': 'es' };
export function AdPrivacyOptions({ language, color }: { language: string; color?: string }) {
  const consent = useAdConsent();
  const dark = useColorScheme() === 'dark';
  if (!consent.required || Platform.OS === 'web') return null;
  const label = labels[aliases[language] ?? language];
  if (!label) { console.warn('[UMP] Missing approved privacy label', language); return null; }
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={consent.busy}
    onPress={() => { void showAdPrivacy().catch(error => console.warn('[UMP] Privacy action failed', error)); }} style={{ minHeight: 48, justifyContent: 'center', paddingVertical: 10 }}>
    <Text allowFontScaling={false} style={{ color: color ?? (dark ? '#ffffff' : '#111111'), fontSize: 16 }}>{label}</Text>
  </Pressable>;
}
