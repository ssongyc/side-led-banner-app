import {
  fontDownloadModalStyles as base,
  WATCH_AD_BUTTON_COLORS,
} from "@/constants/styles";
import { useSettingsLocalizationContext } from "@/contexts/settingsContext";
import { hideAndroidNavigationBar } from "@/utils/SystemChrome";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PhotoCropNoticeModalProps {
  onCancel: () => void;
  onConfirm: (hideToday: boolean) => void;
}

export const PhotoCropNoticeModal = ({ onCancel, onConfirm }: PhotoCropNoticeModalProps) => {
  const { textSectionLabel } = useSettingsLocalizationContext();
  const insets = useSafeAreaInsets();
  const [hideToday, setHideToday] = useState(false);

  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onShow={hideAndroidNavigationBar}
      onRequestClose={onCancel}
    >
      <View
        style={[
          base.root,
          {
            paddingTop: 12 + insets.top,
            paddingBottom: 12 + insets.bottom,
            paddingLeft: 12 + insets.left,
            paddingRight: 12 + insets.right,
          },
        ]}
        accessibilityViewIsModal
      >
        <Pressable style={[base.dim, styles.dimColor]} onPress={onCancel} />
        <View style={[base.card, styles.card]}>
          <View style={base.body}>
            <Text style={base.title} allowFontScaling={false}>
              {textSectionLabel("photoCropNotice")}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                activeOpacity={0.85}
                onPress={onCancel}
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, styles.cancelText]} allowFontScaling={false}>
                  {textSectionLabel("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={() => onConfirm(hideToday)}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={WATCH_AD_BUTTON_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.buttonText, styles.confirmText]} allowFontScaling={false}>
                  {textSectionLabel("confirm")}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.7}
              onPress={() => setHideToday(value => !value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hideToday }}
            >
              <Ionicons
                name={hideToday ? "checkbox" : "square-outline"}
                size={20}
                color={hideToday ? WATCH_AD_BUTTON_COLORS[1] : "#8A8A8A"}
              />
              <Text style={styles.checkboxText} allowFontScaling={false}>
                {textSectionLabel("photoCropNoticeHideToday")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dimColor: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    maxWidth: 420,
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  cancelButton: {
    backgroundColor: "#EFEFEF",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelText: {
    color: "#333333",
  },
  confirmText: {
    color: "#FFFFFF",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 16,
    minHeight: 44,
  },
  checkboxText: {
    fontSize: 14,
    color: "#555555",
  },
});
