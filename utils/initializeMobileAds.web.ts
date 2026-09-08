export async function initializeMobileAds(): Promise<never> { throw new Error("Mobile ads are not supported on web."); }
export function suspendMobileAdsInitialization() { /* No native initialization on web. */ }
