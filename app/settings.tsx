import { usePremium } from "@/contexts/premiumContext";
import BannerAdComponent from "@/components/admob/bannerAd";
import type { AppLocaleKey } from "@/constants/language";
import { settingsStyles } from "@/constants/settingsStyles";
import {
  styles as base,
  resolveDropdownMaxHeight,
  settingsFooterStyles,
} from "@/constants/styles";
import { useSettingsRest } from "@/contexts/settingsContext";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { type Href, useFocusEffect, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { loadRewardedAd } from "@/hooks/useRewardedAd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUNNY_LINKS = {
  homepage: "https://ssongyc.github.io/sunny-homepage/",
  instagram: "https://www.instagram.com/sunnyinnolab/",
  twitter: "https://x.com/Sunnyinnolab",
  terms:
    "https://marmalade-neptune-dbe.notion.site/Terms-Conditions-c18656ce6c6045e590f652bf8291f28b?pvs=74",
  privacy:
    "https://marmalade-neptune-dbe.notion.site/Privacy-Policy-ced8ead72ced4d8791ca4a71a289dd6b",
} as const;

export default function SettingsScreen() {
  const { adsAllowed } = usePremium();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const [languageDropdownContentHeight, setLanguageDropdownContentHeight] =
    useState(0);
  const [languageDropdownWidth, setLanguageDropdownWidth] = useState(0);
  const {
    updateUI,
    textSectionLabel,
    rewardAdLabel,
    resolvedAppLocale,
  } = useSettingsRest();
  const compactHeight = windowH - insets.top - insets.bottom < 480;
  const rootPaddingTop = Platform.OS === "web" ? 0 : insets.top;

  useEffect(() => {
    if (Platform.OS === "web") return;
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch((error) => {
      if (__DEV__) console.error("[Settings] Portrait lock failed", error);
    });
  }, []);

  const languageDropdownItems = useMemo(
    () => [
      { label: "한국어", value: "ko" as const },
      { label: "English", value: "en" as const },
      { label: "日本語", value: "ja" as const },
      { label: "繁體中文", value: "zhTC" as const },
      { label: "简体中文", value: "zhSC" as const },
      { label: "Français", value: "fr" as const },
      { label: "Español", value: "es" as const },
    ],
    [],
  );

  const languageDropdownMaxHeight = useMemo(
    () =>
      resolveDropdownMaxHeight(languageDropdownContentHeight, windowH, {
        capPx: 500,
        windowHeightRatio: 0.7,
      }),
    [languageDropdownContentHeight, windowH],
  );

  const onAppLanguageChange = (item: { value: string }) =>
    updateUI({ appLanguage: item.value as AppLocaleKey });

  const renderLanguageItem = useCallback(
    (item: { label: string; value: string }, selected?: boolean) => (
      <View style={base.dropdownItemContent}>
        <Text
          allowFontScaling={false}
          style={[
            base.dropdownItemTextStyle,
            selected && base.dropdownItemTextStyleSelected,
          ]}
        >
          {item.label}
        </Text>
      </View>
    ),
    [],
  );

  const appVersion = useMemo(
    () => Constants.expoConfig?.version ?? "1.0.0",
    [],
  );

  useFocusEffect(useCallback(() => {
    if (adsAllowed) loadRewardedAd({ restartFailed: true });
  }, [adsAllowed]));

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch((error) => {
      if (__DEV__) console.error("External link open failed", error);
    });
  };

  const footer = (
    <SettingsFooter
        onLogoPress={() => openUrl(SUNNY_LINKS.homepage)}
        termsLabel={textSectionLabel("terms")}
        privacyLabel={textSectionLabel("privacy")}
        onTermsPress={() => openUrl(SUNNY_LINKS.terms)}
        onPrivacyPress={() => openUrl(SUNNY_LINKS.privacy)}
      />
  );

  return (
    <View style={[base.container, { backgroundColor: "#FFFFFF", paddingTop: rootPaddingTop, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={settingsStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={settingsStyles.backButton}
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <Image
            source={require("@/assets/images/icon_arrow_back_DT_xxhdpi.png")}
            style={settingsStyles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={settingsStyles.titleRow}>
          <Text style={settingsStyles.titleText} allowFontScaling={false}>
            {textSectionLabel("settingsTitle")}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          base.scrollViewContainer,
          { paddingBottom: 40 },
        ]}
      >
        <View style={base.settingsRow}>
          <Text style={base.settingsRowLabel} allowFontScaling={false}>
            {textSectionLabel("language")}
          </Text>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              opacity: 0,
              height: 0,
              overflow: "hidden",
            }}
          >
            <View
              onLayout={(e) =>
                setLanguageDropdownContentHeight(e.nativeEvent.layout.height)
              }
            >
              {languageDropdownItems.map((item) => (
                <View key={item.value} style={base.dropdownItemContainerStyle}>
                  <View style={base.dropdownItemContent}>
                    <Text
                      style={base.dropdownItemTextStyle}
                      allowFontScaling={false}
                    >
                      {item.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View
            style={{ width: "56%" }}
            onLayout={(e) =>
              setLanguageDropdownWidth(e.nativeEvent.layout.width)
            }
          >
            <Dropdown
              data={languageDropdownItems}
              labelField="label"
              valueField="value"
              value={resolvedAppLocale}
              onChange={onAppLanguageChange}
              autoScroll={false}
              maxHeight={languageDropdownMaxHeight}
              showsVerticalScrollIndicator={false}
              style={[base.dropdownContainer, { width: "100%" }]}
              containerStyle={[
                base.dropdownContainer,
                base.dropdownMenuContainer,
                languageDropdownWidth ? { width: languageDropdownWidth } : null,
              ]}
              selectedTextStyle={base.dropdownSelectedTextStyle}
              selectedTextProps={{ allowFontScaling: false }}
              itemContainerStyle={base.dropdownItemContainerStyle}
              itemTextStyle={base.dropdownItemTextStyle}
              renderItem={renderLanguageItem}
              iconStyle={base.dropdownIconStyle}
              iconColor="black"
            />
          </View>
        </View>

        <NavigationRow
          label={textSectionLabel("sunnyGames")}
          onPress={() => router.push("/sunnyList" as Href)}
        />

        <LinkRow
          label={textSectionLabel("instagram")}
          linkText={textSectionLabel("link")}
          onPress={() => openUrl(SUNNY_LINKS.instagram)}
        />

        <LinkRow
          label={textSectionLabel("twitter")}
          linkText={textSectionLabel("link")}
          onPress={() => openUrl(SUNNY_LINKS.twitter)}
        />

        <NavigationRow
          label={textSectionLabel("credits")}
          onPress={() => router.push("/credits" as Href)}
        />

        <NavigationRow
          label={textSectionLabel("openSourceInfo")}
          onPress={() => router.push("/openSourceInfo" as Href)}
        />

        <View style={base.settingsRow}>
          <Text style={base.settingsRowLabel} allowFontScaling={false}>
            {textSectionLabel("appVersion")}
          </Text>
          <Text
            style={settingsStyles.versionValueText}
            allowFontScaling={false}
          >
            V{appVersion}
          </Text>
        </View>
        {compactHeight && footer}
      </ScrollView>

      {!compactHeight && footer}
      {(Platform.OS === "web" || adsAllowed) && <BannerAdComponent
        style={{ alignSelf: "stretch", marginBottom: 12 }}
        unavailableLabel={rewardAdLabel("rewardAdUnavailable")}
      />}
    </View>
  );
}

function NavigationRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={base.settingsRow} onPress={onPress}>
      <Text style={base.settingsRowLabel} allowFontScaling={false}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#787878" />
    </TouchableOpacity>
  );
}

function LinkRow({
  label,
  linkText,
  onPress,
}: {
  label: string;
  linkText: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={base.settingsRow} onPress={onPress}>
      <Text style={base.settingsRowLabel} allowFontScaling={false}>
        {label}
      </Text>
      <Text style={settingsStyles.rootLinkText} allowFontScaling={false}>
        {linkText}
      </Text>
    </TouchableOpacity>
  );
}

interface SettingsFooterProps {
  onLogoPress: () => void;
  termsLabel: string;
  privacyLabel: string;
  onTermsPress: () => void;
  onPrivacyPress: () => void;
}

export function SettingsFooter({
  onLogoPress,
  termsLabel,
  privacyLabel,
  onTermsPress,
  onPrivacyPress,
}: SettingsFooterProps) {
  return (
    <View style={[settingsFooterStyles.container, { paddingBottom: 10 }]}>
      <TouchableOpacity onPress={onLogoPress} activeOpacity={0.7}>
        <Image
          source={require("@/assets/images/SIL_logo_setting_mini_black_text.png")}
          style={settingsFooterStyles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={settingsFooterStyles.linksRow}>
        <TouchableOpacity onPress={onTermsPress}>
          <Text style={settingsFooterStyles.linkText} allowFontScaling={false}>
            {termsLabel}
          </Text>
        </TouchableOpacity>

        <Text style={settingsFooterStyles.separator} allowFontScaling={false}>
          |
        </Text>

        <TouchableOpacity onPress={onPrivacyPress}>
          <Text style={settingsFooterStyles.linkText} allowFontScaling={false}>
            {privacyLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
