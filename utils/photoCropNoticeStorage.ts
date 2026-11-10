import AsyncStorage from "@react-native-async-storage/async-storage";

const PHOTO_CROP_NOTICE_HIDDEN_DATE_KEY = "@led_banner_photo_crop_notice_hidden_date_v1";

function localDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export async function isPhotoCropNoticeHiddenToday(): Promise<boolean> {
  const hiddenDate = await AsyncStorage.getItem(PHOTO_CROP_NOTICE_HIDDEN_DATE_KEY);
  return hiddenDate === localDateKey();
}

export async function hidePhotoCropNoticeToday(): Promise<void> {
  await AsyncStorage.setItem(PHOTO_CROP_NOTICE_HIDDEN_DATE_KEY, localDateKey());
}
