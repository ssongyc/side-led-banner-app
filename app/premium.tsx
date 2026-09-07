import { usePremium } from "@/contexts/premiumContext";
import { premiumLabel } from "@/language/premiumLabels";
import { buyPremium, restorePremium, refreshPremium } from "@/utils/ApiClient";
import { moderateScale } from "@/constants/scale";
import { settingsStyles } from "@/constants/settingsStyles";
import { settingsFooterStyles, styles as base } from "@/constants/styles";
import { useSettingsRest } from "@/contexts/settingsContext";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUNNY_LINKS = {
  homepage: "https://ssongyc.github.io/sunny-homepage/",
  terms:
    "https://marmalade-neptune-dbe.notion.site/Terms-Conditions-c18656ce6c6045e590f652bf8291f28b?pvs=74",
  privacy:
    "https://marmalade-neptune-dbe.notion.site/Privacy-Policy-ced8ead72ced4d8791ca4a71a289dd6b",
} as const;

export default function PremiumScreen() {
  const router = useRouter();
  const [pageHeight, setPageHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const { textSectionLabel, resolvedAppLocale } = useSettingsRest();
  const premium = usePremium();
  const label = (key: Parameters<typeof premiumLabel>[0]) => premiumLabel(key, resolvedAppLocale);
  const busy = premium.operation !== "idle";
  const canBuy = !busy && premium.entitlement === "free" && premium.product !== null && premium.notice !== "pending";
  useEffect(() => { void refreshPremium(); }, []);
  const rootPaddingTop = Platform.OS === "web" ? 0 : insets.top;
  const footerPaddingBottom = Platform.OS === "ios" ? Math.max(14, insets.bottom + 8) : 14;

  const displayedPrice = premium.isPremium ? label("owned") :
    busy ? label(premium.operation === "idle" ? "loading" : premium.operation) :
    premium.notice === "pending" ? label("pending") :
    premium.product?.displayPrice ?? label("unavailable");
  const cardTopSpacing = Math.max(
    0,
    pageHeight / 2 - rootPaddingTop - headerHeight - cardHeight + moderateScale(50) / 2,
  );

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn("Failed to open URL", url, error);
    }
  };

  return (
    <View
      style={[base.container, { backgroundColor: "#000000", paddingTop: rootPaddingTop }]}
      onLayout={({ nativeEvent }) => setPageHeight(nativeEvent.layout.height)}
    >
      {Platform.OS === "ios" ? <StatusBar style="light" /> : null}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={settingsStyles.premiumHeader}
          onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={settingsStyles.backButton}
            accessibilityLabel="Back"
            hitSlop={10}
          >
            <Image
              source={require("@/assets/images/icon_arrow_back_DT_xxhdpi.png")}
              style={[settingsStyles.backIcon, settingsStyles.backIconDark]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Image
            source={require("@/assets/images/icon_donation_DT_xxhdpi.png")}
            style={settingsStyles.premiumHeaderIcon}
            resizeMode="contain"
          />
          <Text style={settingsStyles.premiumTitleText} allowFontScaling={false}>
            {textSectionLabel("upgradeToPremium")}
          </Text>
        </View>

        <View style={[settingsStyles.premiumContent, { paddingTop: cardTopSpacing, paddingBottom: 24 }]}>
          <View
            style={settingsStyles.premiumCard}
            onLayout={({ nativeEvent }) => setCardHeight(nativeEvent.layout.height)}
          >
            <View style={settingsStyles.premiumCardBody}>
              <View style={settingsStyles.premiumIconPane}>
                <Image
                  source={require("@/assets/images/icon_donation_DT_xxhdpi.png")}
                  style={settingsStyles.premiumDonationIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={settingsStyles.premiumTextPane}>
                <Text style={settingsStyles.premiumProductTitle} allowFontScaling={false}>
                  {textSectionLabel("premiumProductTitle")}
                </Text>
                <Text style={settingsStyles.premiumProductDescription} allowFontScaling={false}>
                  {textSectionLabel("premiumProductDescription")}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[settingsStyles.premiumPriceBar, { opacity: canBuy || premium.isPremium ? 1 : 0.55 }]}
              onPress={() => { void buyPremium(); }}
              disabled={!canBuy}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canBuy, busy }}
            >
              <Text style={[settingsStyles.premiumPriceText, { textAlign: "center", paddingHorizontal: 12 }]} allowFontScaling={false}>
                {displayedPrice}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={settingsStyles.premiumRestoreArea}>
          {premium.notice && (
            <Text allowFontScaling={false} accessibilityLiveRegion="polite"
              style={{ color: "#ffffff", textAlign: "center", marginBottom: 18, paddingHorizontal: 20 }}>
              {label(premium.notice)}
            </Text>
          )}
          {(premium.notice === "unavailable" || premium.notice === "error" ||
            premium.notice === "verificationFailed" || premium.notice === "pending") && (
            <TouchableOpacity onPress={() => { void refreshPremium(); }} disabled={busy}
              accessibilityRole="button" style={{ padding: 12, opacity: busy ? 0.5 : 1 }}>
              <Text allowFontScaling={false} style={{ color: "#ffffff", textAlign: "center" }}>{label("retry")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => { void restorePremium(); }} disabled={busy || Platform.OS === "web"}
            accessibilityRole="button" accessibilityState={{ disabled: busy || Platform.OS === "web", busy }}
            style={{ paddingVertical: 12, opacity: busy ? 0.5 : 1 }}>
          <Text style={settingsStyles.premiumRestoreText} allowFontScaling={false}>
            {textSectionLabel("restorePreviousPurchase")}
          </Text>
          </TouchableOpacity>
        </View>

        <View style={[settingsFooterStyles.containerDark, { paddingBottom: footerPaddingBottom }]}>
          <TouchableOpacity onPress={() => openUrl(SUNNY_LINKS.homepage)} activeOpacity={0.7}>
            <Image
              source={require("@/assets/images/SIL_logo_setting_mini_white_text.png")}
              style={settingsFooterStyles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={settingsFooterStyles.linksRow}>
            <TouchableOpacity onPress={() => openUrl(SUNNY_LINKS.terms)}>
              <Text style={settingsFooterStyles.linkTextDark} allowFontScaling={false}>
                {textSectionLabel("terms")}
              </Text>
            </TouchableOpacity>

            <Text style={settingsFooterStyles.separatorDark} allowFontScaling={false}>
              |
            </Text>

            <TouchableOpacity onPress={() => openUrl(SUNNY_LINKS.privacy)}>
              <Text style={settingsFooterStyles.linkTextDark} allowFontScaling={false}>
                {textSectionLabel("privacy")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
