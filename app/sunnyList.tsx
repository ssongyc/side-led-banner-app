import { uiThemeFontStyle } from "@/constants/appFonts";
import { settingsStyles } from "@/constants/settingsStyles";
import { styles as base } from "@/constants/styles";
import { useSettingsRest } from "@/contexts/settingsContext";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
type SunnyAppEntry = {
  id: string;
  name: string;
  appStoreUrl: string;
  playStoreUrl: string;
  thumbnail?: ImageSourcePropType;
};

/** Sunny앱 목록 */
const SUNNY_APPS: SunnyAppEntry[] = [
  {
    id: "sky_peacemaker",
    name: "Sky Peacemaker",
    appStoreUrl:
      "https://apps.apple.com/ca/app/sky-peacemaker-finger-force/id6744907473",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.mwm.ffigher.gg",
    thumbnail: require("@/assets/images/Sunny's_Icon/Sky-Peacemaker-Finger-Force-Icon.png"),
  },
  {
    id: "world_movie_trailer",
    name: "World Movie Trailer",
    appStoreUrl:
      "https://apps.apple.com/ca/app/world-movie-trailer/id6670228768",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.sunnyinnolab.worldMovieTrailer",
    thumbnail: require("@/assets/images/Sunny's_Icon/World-Movie-Trailer-New-Icon.png"),
  },
  {
    id: "world_book_ranking",
    name: "World Book Ranking",
    appStoreUrl:
      "https://apps.apple.com/ca/app/world-book-ranking/id6755462071",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.worldbookranking",
    thumbnail: require("@/assets/images/Sunny's_Icon/World-Book-Ranking-Icon.png"),
  },
  {
    id: "simply_multi_timer",
    name: "Simply Multi Timer",
    appStoreUrl:
      "https://apps.apple.com/us/app/simply-multi-timer/id6746514607",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.sunnyinnolab.sunnysmtapp2",
    thumbnail: require("@/assets/images/Sunny's_Icon/Simply-Multi-Timer-Icon.png"),
  },
  {
    id: "watermelon_checker",
    name: "Watermelon Checker",
    appStoreUrl: "https://watermelonchecker.onelink.me/zF1F/obulncrt",
    playStoreUrl: "https://watermelonchecker.onelink.me/zF1F/obulncrt",
    thumbnail: require("@/assets/images/Sunny's_Icon/Watermelon-Checker-Icon-1024.jpg"),
  },
  {
    id: "wisdom_qclock",
    name: "Wisdom Qclock",
    appStoreUrl: "https://apps.apple.com/ca/app/wisdom-qclock/id6751124999",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.sunnyinnolab.qclock",
    thumbnail: require("@/assets/images/Sunny's_Icon/Wisdom-Qclock-Icon.png"),
  },
  {
    id: "dual_flashlight",
    name: "Dual Flashlight",
    appStoreUrl: "https://apps.apple.com/app/dual-flashlight/id6741048362",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.sunnyinnolab.dualflashlight2",
    thumbnail: require("@/assets/images/Sunny's_Icon/Dual-Flashlight-Icon.png"),
  },
  {
    id: "histree",
    name: "Histree",
    appStoreUrl: "https://apps.apple.com/ca/app/histree/id6754057761",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.todayhistory.todayhistory",
    thumbnail: require("@/assets/images/Sunny's_Icon/Histree-Icon.png"),
  },
  {
    id: "scanatory",
    name: "Scanatory",
    appStoreUrl: "https://apps.apple.com/ph/app/scanatory/id6757365297",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.sunnyinnolab.scanatory",
    thumbnail: require("@/assets/images/Sunny's_Icon/Scanatory-Icon.png"),
  },
  {
    id: "play_memo",
    name: "Play Memo",
    appStoreUrl: "https://apps.apple.com/us/app/play-memo/id6746741354",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.sunnyinnolab.playmemo",
    thumbnail: require("@/assets/images/Sunny's_Icon/Play-Memo-Icon.png"),
  },
  {
    id: "find_four",
    name: "Find Four",
    appStoreUrl:
      "https://apps.apple.com/ca/app/find-four-find-4-differences/id6478101361",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.mwm.findfour.gg",
    thumbnail: require("@/assets/images/Sunny's_Icon/Find-Four-Icon.png"),
  },
  {
    id: "decibella",
    name: "Decibella",
    appStoreUrl: "https://apps.apple.com/ca/app/decibella/id6751743532",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=cc.cavecafe.app.decibella",
    thumbnail: require("@/assets/images/Sunny's_Icon/decibella-Icon-1024.png"),
  },
];

const THUMB_SIZE = 44;

const listStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
    gap: 14,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    backgroundColor: "#E7E7E7",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholderText: {
    ...uiThemeFontStyle,
    fontSize: 20,
    fontWeight: "700",
    color: "#9A9A9A",
  },
  appName: {
    ...uiThemeFontStyle,
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "black",
  },
  linkText: {
    ...uiThemeFontStyle,
    fontSize: 15,
    color: "#9A9A9A",
    fontWeight: "500",
  },
});

function pickStoreUrl(entry: SunnyAppEntry): string {
  if (Platform.OS === "android") return entry.playStoreUrl;
  if (Platform.OS === "ios") return entry.appStoreUrl;
  return entry.appStoreUrl;
}

export default function SunnyListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { textSectionLabel } = useSettingsRest();

  const openStore = (entry: SunnyAppEntry) => {
    void Linking.openURL(pickStoreUrl(entry)).catch((error) => {
      if (__DEV__) console.error("Store link open failed", error);
    });
  };

  return (
    <View style={[base.container, { paddingTop: insets.top }]}>
      <View style={settingsStyles.headerInline}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={settingsStyles.backButton}
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <Image
            source={require("@/assets/images/icon_arrow_back_DT_xxhdpi.png")}
            style={settingsStyles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text style={settingsStyles.titleText} allowFontScaling={false}>
          {textSectionLabel("sunnyGames")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={base.scrollViewContainer}
      >
        {SUNNY_APPS.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={listStyles.row}
            onPress={() => openStore(entry)}
            activeOpacity={0.7}
          >
            <View style={listStyles.thumbnail}>
              {entry.thumbnail ? (
                <Image
                  source={entry.thumbnail}
                  style={listStyles.thumbnailImage}
                  contentFit="cover"
                />
              ) : (
                <Text
                  style={listStyles.thumbnailPlaceholderText}
                  allowFontScaling={false}
                >
                  {entry.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text
              style={listStyles.appName}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {entry.name}
            </Text>
            <Text style={listStyles.linkText} allowFontScaling={false}>
              {textSectionLabel("link")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
