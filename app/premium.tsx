import { settingsStyles } from "@/constants/settingsStyles";
import { settingsFooterStyles, styles as base } from "@/constants/styles";
import { useSettingsRest } from "@/contexts/settingsContext";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, Linking, Platform, Text, TouchableOpacity, View } from "react-native";
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
  const insets = useSafeAreaInsets();
  const { textSectionLabel } = useSettingsRest();
  const rootPaddingTop = Platform.OS === "ios" ? insets.top : 0;
  const footerPaddingBottom = Platform.OS === "ios" ? Math.max(14, insets.bottom + 8) : 14;

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn("Failed to open URL", url, error);
    }
  };

  return (
    <View style={[base.container, { backgroundColor: "#000000", paddingTop: rootPaddingTop }]}>
      {Platform.OS === "ios" ? <StatusBar style="light" /> : null}
      <View style={settingsStyles.premiumHeader}>
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
        <Image
          source={require("@/assets/images/icon_donation_DT_xxhdpi.png")}
          style={settingsStyles.premiumHeaderIcon}
          resizeMode="contain"
        />
        <Text style={settingsStyles.premiumTitleText} allowFontScaling={false}>
          {textSectionLabel("upgradeToPremium")}
        </Text>
      </View>

      <View style={settingsStyles.premiumContent}>
        <View style={settingsStyles.premiumCard}>
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
          <View style={settingsStyles.premiumPriceBar}>
            <Text style={settingsStyles.premiumPriceText} allowFontScaling={false}>
              {textSectionLabel("premiumPrice")}
            </Text>
          </View>
        </View>
      </View>

      <View style={settingsStyles.premiumRestoreArea}>
        <Text style={settingsStyles.premiumRestoreText} allowFontScaling={false}>
          {textSectionLabel("restorePreviousPurchase")}
        </Text>
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
    </View>
  );
}
