import { ReservedText } from "@/components/ReservedText";
import { uiThemeFontStyle } from "@/constants/appFonts";
import { settingsStyles } from "@/constants/settingsStyles";
import { usePremium } from "@/contexts/premiumContext";
import { useSettingsLocalizationContext } from "@/contexts/settingsContext";
import { premiumLabel } from "@/language/premiumLabels";
import { buyPremium, refreshPremium, restorePremium, setPremiumShopVisible } from "@/utils/ApiClient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const { textSectionLabel, resolvedAppLocale } = useSettingsLocalizationContext();
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
  const actionText = isPremium ? label("owned") :
    operation === "purchasing" || operation === "restoring" ? label(operation) :
      textSectionLabel("shopBuy");
  const notices = [
    label("loading"), label("unavailable"), label("error"), label("cancelled"),
    label("pending"), label("purchased"), label("restored"), label("nothingToRestore"), label("verificationFailed"),
  ];
  const statusText = paymentPending && !isPremium ? label("pending") :
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

  return (
    <View style={[styles.screen, {
      paddingTop: Platform.OS === "web" ? 0 : insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    }]}>
      <View style={settingsStyles.header}>
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
        <View style={settingsStyles.titleRow}>
          <Text allowFontScaling={false} accessibilityRole="header" style={settingsStyles.titleText}>
            {textSectionLabel("shop")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text allowFontScaling={false} accessibilityRole="header" style={styles.title}>
            LED POP PRO
          </Text>
          <Text allowFontScaling={false} style={styles.title}>
            {textSectionLabel("premiumProductTitle")}
          </Text>
          <Text allowFontScaling={false} style={styles.description}>
            {textSectionLabel("premiumProductDescription")}
          </Text>

          <View style={styles.priceSlot}>
            <Text allowFontScaling={false} style={styles.price}>
              {isPremium ? "" : displayedPrice}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canBuy, busy }}
            disabled={!canBuy}
            onPress={() => { if (price) void buyPremium(price); }}
            style={[styles.buy, !canBuy && !isPremium && styles.disabled]}
          >
            <ReservedText
              text={actionText}
              variants={[textSectionLabel("shopBuy"), label("owned"), label("purchasing"), label("restoring")]}
              textStyle={styles.buyText}
            />
          </Pressable>
          <ReservedText text={statusText} variants={notices} textStyle={styles.description} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canRestore, busy }}
          disabled={!canRestore}
          onPress={() => { void restorePremium(); }}
          style={[styles.secondary, !canRestore && styles.disabled]}
        >
          <Text allowFontScaling={false} style={styles.secondaryText}>
            {textSectionLabel("restorePreviousPurchase")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityElementsHidden={!showRetry}
          importantForAccessibility={showRetry ? "auto" : "no-hide-descendants"}
          aria-hidden={!showRetry}
          accessibilityState={{ disabled: busy || !showRetry }}
          disabled={busy || !showRetry}
          onPress={() => { void refreshPremium(); }}
          style={[styles.secondary, busy && styles.disabled, !showRetry && styles.hidden]}
        >
          <Text allowFontScaling={false} style={styles.secondaryText}>{label("retry")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  backButton: { minWidth: 48, minHeight: 48 },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: "#F5F5F5", borderRadius: 16, padding: 20, alignItems: "center", gap: 12 },
  title: { ...uiThemeFontStyle, color: "#111111", fontSize: 22, fontWeight: "700", textAlign: "center" },
  description: { ...uiThemeFontStyle, color: "#444444", fontSize: 15, textAlign: "center" },
  priceSlot: { minHeight: 28, justifyContent: "center" },
  price: { ...uiThemeFontStyle, color: "#222222", fontSize: 19, fontWeight: "700", textAlign: "center" },
  buy: { minHeight: 48, width: "100%", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#222222", borderRadius: 10, justifyContent: "center" },
  buyText: { ...uiThemeFontStyle, color: "#FFFFFF", fontSize: 16, fontWeight: "700", textAlign: "center" },
  secondary: { minHeight: 48, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  secondaryText: { ...uiThemeFontStyle, color: "#222222", fontSize: 16, textAlign: "center", textDecorationLine: "underline" },
  disabled: { opacity: 0.5 },
  hidden: { opacity: 0 },
});
