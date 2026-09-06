import mobileAds from "react-native-google-mobile-ads";

export async function initializeMobileAds() {
  await mobileAds().initialize();
}
