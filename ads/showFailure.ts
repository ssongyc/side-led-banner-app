// RN Google Mobile Ads 16.5.0: these errors precede native presentation.
export function isConfirmedPreShowFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown };
  const code = typeof value.code === 'string' ? value.code.split('/').pop() : '';
  return code === 'null-activity' || code === 'nil-vc' || code === 'not-ready' ||
    value.message === 'RewardedAd.show() The requested RewardedAd has not loaded and could not be shown.' ||
    value.message === 'Unsupported or unavailable rewarded ad.';
}
