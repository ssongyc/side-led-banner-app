import { uiThemeFontStyle } from "@/constants/appFonts";
import { useSettingsRest } from "@/contexts/settingsContext";
import { hideAndroidNavigationBar } from "@/utils/SystemChrome";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * 개발 빌드에서만 표시. Google Sheet CSV fetch 결과를 화면·콘솔에서 확인합니다.
 * 프로덕션에서는 마운트되지 않아 네트워크 요청도 없습니다.
 */
export function SheetFetchDebugPanel() {
  if (!__DEV__) {
    return null;
  }
  return <SheetFetchDebugPanelInner />;
}

function SheetFetchDebugPanelInner() {
  const [open, setOpen] = useState(false);
  const {
    sheetParseResult: data,
    sheetStringsLoading: loading,
    sheetStringsError: error,
    refetchSheetStrings: refetch,
  } = useSettingsRest();

  useEffect(() => {
    if (loading) return;
    console.log("[SheetFetchDebug]", {
      ok: !error && !!data,
      rowCount: data?.rows.length,
      version: data?.sheetVersion,
      error: error?.message,
    });
  }, [loading, data, error]);

  const bodyText = useMemo(() => {
    if (loading) return "로딩 중…";
    if (error) return error.message;
    if (!data) return "(null)";
    return JSON.stringify(data, null, 2);
  }, [loading, error, data]);

  return (
    <>
      <Pressable
        style={styles.fab}
        onPress={() => setOpen(true)}
        accessibilityLabel="Google Sheet CSV 디버그"
      >
        <Text style={styles.fabText} allowFontScaling={false}>
          CSV
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop} onTouchStart={hideAndroidNavigationBar}>
          <View style={styles.sheet}>
            <View style={styles.toolbar}>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Text style={styles.toolbarBtn} allowFontScaling={false}>닫기</Text>
              </Pressable>
              <Pressable onPress={() => void refetch()} hitSlop={12}>
                <Text style={styles.toolbarBtn} allowFontScaling={false}>다시 불러오기</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
            >
              <Text selectable style={styles.mono} allowFontScaling={false}>
                {bodyText}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 10,
    bottom: 120,
    zIndex: 9999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  fabText: {
    ...uiThemeFontStyle,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    maxHeight: "72%",
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 8,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  toolbarBtn: {
    ...uiThemeFontStyle,
    color: "#6ae",
    fontSize: 16,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mono: {
    color: "#e8e8e8",
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
});
