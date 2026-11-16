import { ReservedText } from "@/components/ReservedText";
import { usePremium } from "@/contexts/premiumContext";
import { premiumLabel } from "@/language/premiumLabels";
import { buyPremium, restorePremium, refreshPremium } from "@/utils/ApiClient";
import { settingsStyles } from "@/constants/settingsStyles";
import { settingsFooterStyles, styles as base } from "@/constants/styles";
import { useSettingsLocalizationContext } from "@/contexts/settingsContext";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Image, Linking, Platform, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUNNY_LINKS = {
  homepage: "https://sunnyinnolab.com",
  terms:
    "https://marmalade-neptune-dbe.notion.site/Terms-Conditions-c18656ce6c6045e590f652bf8291f28b?pvs=74",
  privacy:
    "https://marmalade-neptune-dbe.notion.site/Privacy-Policy-ced8ead72ced4d8791ca4a71a289dd6b",
} as const;

export default function PremiumScreen() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { textSectionLabel, resolvedAppLocale } = useSettingsLocalizationContext();
  const premium = usePremium();
  const label = (key: Parameters<typeof premiumLabel>[0]) => premiumLabel(key, resolvedAppLocale);
  const busy = premium.operation !== "idle";
  const canBuy = !premium.paymentPending && !busy && premium.entitlement === "free" && premium.product !== null && premium.notice !== "pending";
  useEffect(() => { void refreshPremium(); }, []);
  const rootPaddingTop = Platform.OS === "web" ? 0 : insets.top;
  const footerPaddingBottom = Platform.OS === "ios" ? Math.max(14, insets.bottom + 8) : 14;

  const displayedPrice = premium.isPremium ? label("owned") :
    busy ? label(premium.operation === "idle" ? "loading" : premium.operation) :
    premium.notice === "pending" ? label("pending") :
    premium.product?.displayPrice ?? label("unavailable");
  const cardTopSpacing = Math.min(48, Math.max(16, windowHeight * 0.05));
  const priceVariants = [
    label("owned"), label("loading"), label("purchasing"), label("restoring"),
    label("pending"), label("unavailable"), premium.product?.displayPrice ?? "",
  ];
  const noticeVariants = [
    label("unavailable"), label("error"), label("cancelled"), label("pending"),
    label("purchased"), label("restored"), label("nothingToRestore"), label("verificationFailed"),
  ];
  const canRetry = premium.notice === "unavailable" || premium.notice === "error" ||
    premium.notice === "verificationFailed" || premium.notice === "pending";

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
    >
      {Platform.OS === "ios" ? <StatusBar style="light" /> : null}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={settingsStyles.premiumHeader}
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
              <ReservedText text={displayedPrice} variants={priceVariants}
                textStyle={[settingsStyles.premiumPriceText, { textAlign: "center", paddingHorizontal: 12 }]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={settingsStyles.premiumRestoreArea}>
          <View style={{ alignSelf: "stretch", marginBottom: 18 }}>
            <ReservedText text={premium.notice ? label(premium.notice) : ""} variants={noticeVariants}
              textStyle={{ color: "#ffffff", textAlign: "center", paddingHorizontal: 20 }} />
          </View>
          <TouchableOpacity onPress={() => { void refreshPremium(); }} disabled={busy || !canRetry}
            accessibilityRole="button" accessibilityElementsHidden={!canRetry}
            importantForAccessibility={canRetry ? "auto" : "no-hide-descendants"}
            style={{ padding: 12, opacity: !canRetry ? 0 : busy ? 0.5 : 1 }}>
            <Text allowFontScaling={false} style={{ color: "#ffffff", textAlign: "center" }}>{label("retry")}</Text>
          </TouchableOpacity>
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
