import type { AppLocaleKey } from "@/constants/language";
import { STARTUP_RECOVERY_LABELS } from "@/language/startupRecoveryLabels";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function StartupRecovery({ locale, kind, onRetry }: {
  locale: AppLocaleKey; kind: "storage" | "splash"; onRetry: () => void;
}) {
  const insets = useSafeAreaInsets();
  const labels = STARTUP_RECOVERY_LABELS[locale];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#1a1a1a" }} canCancelContentTouches
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24, paddingLeft: insets.left + 24, paddingRight: insets.right + 24 }}>
      <Text allowFontScaling={false} accessibilityRole="header"
        style={{ color: "white", fontSize: 22, fontWeight: "700", marginBottom: 16 }}>{labels.title}</Text>
      <Text allowFontScaling={false} style={{ color: "white", fontSize: 18, marginBottom: 24 }}>{labels[kind]}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={onRetry}
        style={{ minHeight: 48, padding: 14, backgroundColor: "#FF6E00", borderRadius: 12 }}>
        <Text allowFontScaling={false} style={{ color: "#111", fontSize: 18, textAlign: "center", fontWeight: "700" }}>{labels.retry}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
