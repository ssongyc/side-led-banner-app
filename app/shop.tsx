import { ReservedText } from "@/components/ReservedText";
import { uiThemeFontStyle } from "@/constants/appFonts";
import { settingsStyles } from "@/constants/settingsStyles";
import { SUNNY_LINKS } from "@/constants/sunnyLinks";
import { usePremium } from "@/contexts/premiumContext";
import { useSettingsLocalizationContext } from "@/contexts/settingsContext";
import { premiumLabel } from "@/language/premiumLabels";
import { buyPremium, refreshPremium, restorePremium, setPremiumShopVisible } from "@/utils/ApiClient";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatShopPrice(displayPrice: string, currency: string) {
  if (!/^[A-Z]{3}$/.test(currency)) return displayPrice;
  const prefix = currency === "USD" ? "US$" : currency === "CAD" ? "CA$" : `${currency}$`;
  const price = displayPrice.trim();
  const leadingDollar = /^(?:[A-Za-z]{1,3}\s*)?\$(?:\s*[A-Za-z]{2,3})?\s*(?=\d)/;
  const trailingDollar = /\s*(?:[A-Za-z]{1,3}\s*)?\$(?:\s*[A-Za-z]{2,3})?$/;
  if (leadingDollar.test(price)) return prefix + price.replace(leadingDollar, "");
  if (/^\d/.test(price) && trailingDollar.test(price)) return prefix + price.replace(trailingDollar, "");
  if (currency === "USD" || currency === "CAD") {
    const leadingCode = new RegExp(`^${currency}\\s*(?=\\d)`);
    const trailingCode = new RegExp(`\\s*${currency}$`);
    if (leadingCode.test(price)) return prefix + price.replace(leadingCode, "");
    if (/^\d/.test(price) && trailingCode.test(price)) return prefix + price.replace(trailingCode, "");
  }
  return displayPrice;
}

export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compactHeight = height - insets.top - insets.bottom < 600;
  const { textSectionLabel, rewardAdLabel, resolvedAppLocale } = useSettingsLocalizationContext();
  const { operation, entitlement, paymentPending, price, notice, isPremium } = usePremium();
  const isNativeStore = Platform.OS === "android" || Platform.OS === "ios";
  const label = (key: Parameters<typeof premiumLabel>[0]) => premiumLabel(key, resolvedAppLocale);
  const busy = operation !== "idle";
  const canBuy = isNativeStore && !busy && !paymentPending && entitlement === "free" && price !== null;
  const canRestore = isNativeStore && !busy;
  const showRetry = isNativeStore && (
    (!isPremium && !price) || notice === "unavailable" || notice === "error" ||
    notice === "verificationFailed" || paymentPending
  );
  const displayedPrice = price ? formatShopPrice(price.displayPrice, price.currency) : "";
  const actionText = operation === "purchasing" || operation === "restoring" ? label(operation) :
      textSectionLabel("shopBuy");
  const notices = [
    label("loading"), label("unavailable"), label("error"), label("cancelled"),
    label("pending"), label("purchased"), label("restored"), label("nothingToRestore"), label("verificationFailed"),
  ];
  const statusText = isPremium && notice === "purchased" ? "" :
    paymentPending && !isPremium ? label("pending") :
    notice ? label(notice) : operation === "loading" ? label("loading") : "";

  useFocusEffect(useCallback(() => {
    if (!isNativeStore) return;
    setPremiumShopVisible(true);
    void refreshPremium();
    return () => setPremiumShopVisible(false);
  }, [isNativeStore]));

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/settings");
  }

  const benefits = [
    textSectionLabel("premiumProductTitle"),
    rewardAdLabel("rewardBenefitTextSize"),
    rewardAdLabel("rewardBenefitColors"),
    rewardAdLabel("rewardBenefitEffects"),
    rewardAdLabel("rewardBenefitFavorites"),
    rewardAdLabel("rewardBenefitOutlineShadow"),
  ];

  function renderRestore() {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canRestore, busy }}
        disabled={!canRestore}
        onPress={() => { void restorePremium(); }}
        style={[styles.restore, !canRestore && styles.disabled]}
      >
        <Text allowFontScaling={false} style={styles.restoreText}>
          {textSectionLabel("restorePreviousPurchase")}
        </Text>
      </Pressable>
    );
  }

  function renderPurchasePanel() {
    return (
      <View style={styles.purchasePanel}>
        <View style={styles.purchaseContent}>
          <ReservedText text={statusText} variants={notices} textStyle={styles.status} />
          {showRetry && (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => { void refreshPremium(); }}
              style={[styles.retry, busy && styles.disabled]}
            >
              <Text allowFontScaling={false} style={styles.restoreText}>{label("retry")}</Text>
            </Pressable>
          )}
          {isPremium ? (
            <View style={styles.ownedStatus} accessibilityLiveRegion="polite">
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Ionicons name="checkmark" size={20} color="#913A00" />
              </View>
              <Text allowFontScaling={false} style={[styles.buyText, styles.ownedText]}>
                {label("owned")}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.priceSlot}>
                <Text allowFontScaling={false} style={styles.price}>
                  {displayedPrice}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canBuy, busy }}
                disabled={!canBuy}
                onPress={() => { if (price) void buyPremium(price); }}
                style={[styles.buy, !canBuy && styles.disabled]}
              >
                <LinearGradient
                  colors={["#FF8900", "#FF6500"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.buyFill}
                >
                  <ReservedText
                    text={actionText}
                    variants={[textSectionLabel("shopBuy"), label("purchasing"), label("restoring")]}
                    textStyle={styles.buyText}
                  />
                </LinearGradient>
              </Pressable>
            </>
          )}
          {renderRestore()}
        </View>
      </View>
    );
  }

  function openUrl(url: string) {
    void Linking.openURL(url).catch((error) => {
      if (__DEV__) console.error("External link open failed", error);
    });
  }

  function renderFooter() {
    return (
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.footerContent}>
          <Pressable accessibilityRole="link" accessibilityLabel="Sunny Innovation Lab"
            onPress={() => openUrl(SUNNY_LINKS.homepage)} style={styles.logoLink}>
            <Image source={require("@/assets/images/SIL_logo_setting_mini_black_text.png")}
              resizeMode="contain" style={styles.logo} />
          </Pressable>
          <View style={styles.footerLinks}>
            <Pressable accessibilityRole="link" onPress={() => openUrl(SUNNY_LINKS.terms)} style={styles.footerLink}>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.footerText}>Terms</Text>
            </Pressable>
            <View style={styles.footerSeparator} />
            <Pressable accessibilityRole="link" onPress={() => openUrl(SUNNY_LINKS.privacy)} style={styles.footerLink}>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.footerText}>Privacy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, {
      paddingTop: Platform.OS === "web" ? 0 : insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}>
      <View style={[settingsStyles.header, styles.header]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          style={[settingsStyles.backButton, styles.backButton]}
        >
          <Image
            source={require("@/assets/images/icon_arrow_back_DT_xxhdpi.png")}
            style={settingsStyles.backIcon}
            resizeMode="contain"
          />
        </Pressable>
        <View style={[settingsStyles.titleRow, styles.headerTitle]}>
          <Text allowFontScaling={false} accessibilityRole="header" style={settingsStyles.titleText}>
            {textSectionLabel("shop")}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text allowFontScaling={false} accessibilityRole="header" style={styles.title}>
            LED POP PRO
          </Text>
          <Text allowFontScaling={false} style={styles.description}>
            {isPremium ? label("ownedDescription") : textSectionLabel("premiumProductDescription")}
          </Text>
          <View style={styles.benefits}>
            {benefits.map((benefit, index) => (
              <View key={index} style={[styles.benefitRow, index < benefits.length - 1 && styles.benefitDivider]}>
                <View style={styles.check} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
                <Text allowFontScaling={false} style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
        {compactHeight && renderPurchasePanel()}
        {compactHeight && renderFooter()}
      </ScrollView>

      {!compactHeight && renderPurchasePanel()}
      {!compactHeight && renderFooter()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E7E7E7" },
  backButton: { minWidth: 48, minHeight: 48 },
  headerTitle: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  title: { ...uiThemeFontStyle, color: "#080808", fontSize: 36, fontWeight: "700", textAlign: "left" },
  description: { ...uiThemeFontStyle, color: "#666666", fontSize: 13.5, lineHeight: 20, marginTop: 10 },
  benefits: { marginTop: 24 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 40, paddingVertical: 10 },
  benefitDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E4E4E4" },
  check: { width: 18, height: 18, borderRadius: 4, backgroundColor: "#FF7800", alignItems: "center", justifyContent: "center" },
  benefitText: { ...uiThemeFontStyle, flex: 1, fontSize: 14, lineHeight: 20, color: "#262626" },
  purchasePanel: { flexShrink: 0, backgroundColor: "#FAFAFA" },
  purchaseContent: { width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingBottom: 18 },
  status: { ...uiThemeFontStyle, color: "#555555", fontSize: 12, lineHeight: 17, textAlign: "center" },
  restore: { minHeight: 48, justifyContent: "center", alignItems: "center" },
  restoreText: { ...uiThemeFontStyle, color: "#777777", fontSize: 12, lineHeight: 17, textAlign: "center" },
  retry: { minHeight: 48, justifyContent: "center", alignItems: "center" },
  priceSlot: { minHeight: 34, justifyContent: "center", marginBottom: 10 },
  price: { ...uiThemeFontStyle, color: "#090909", fontSize: 22, fontWeight: "700", textAlign: "center" },
  buy: { borderRadius: 14, shadowColor: "#FF7800", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 5 }, shadowRadius: 8, elevation: 3 },
  buyFill: { minHeight: 52, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, justifyContent: "center" },
  buyText: { ...uiThemeFontStyle, color: "#FFFFFF", fontSize: 16, fontWeight: "700", textAlign: "center" },
  ownedStatus: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: "#FFF0E0" },
  ownedText: { color: "#913A00", flexShrink: 1 },
  footer: { backgroundColor: "#3D3D3D", paddingTop: 4, paddingHorizontal: 16 },
  footerContent: { width: "100%", maxWidth: 600, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  logoLink: { minWidth: 100, minHeight: 48, justifyContent: "center" },
  logo: { width: 96, height: 34, tintColor: "#FFFFFF" },
  footerLinks: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  footerLink: { minWidth: 48, minHeight: 48, paddingHorizontal: 6, justifyContent: "center" },
  footerText: { ...uiThemeFontStyle, color: "#DDDDDD", fontSize: 12 },
  footerSeparator: { width: 1, height: 12, backgroundColor: "#929292" },
  disabled: { opacity: 0.5 },
});
