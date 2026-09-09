import { useSafeAreaInsets } from "react-native-safe-area-context";
import { uiThemeFontStyle } from "@/constants/appFonts";
import { useSettingsRest } from "@/contexts/settingsContext";
import { hideAndroidNavigationBar } from "@/utils/SystemChrome";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const insets = useSafeAreaInsets();
  const drag = useRef({ x: 0, y: 0, moved: false });
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
        <View style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]} onTouchStart={hideAndroidNavigationBar}>
          <View style={styles.sheet}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled" canCancelContentTouches
              onTouchStart={event => { drag.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, moved: false }; }}
              onTouchMove={event => {
                if (Math.hypot(event.nativeEvent.pageX - drag.current.x, event.nativeEvent.pageY - drag.current.y) > 8) drag.current.moved = true;
              }}
              onScrollBeginDrag={() => { drag.current.moved = true; }}>
            <View style={styles.toolbar}>
              <Pressable onPress={() => { if (!drag.current.moved) setOpen(false); }} hitSlop={12}>
                <Text style={styles.toolbarBtn} allowFontScaling={false}>닫기</Text>
              </Pressable>
              <Pressable onPress={() => { if (!drag.current.moved) void refetch(); }} hitSlop={12}>
                <Text style={styles.toolbarBtn} allowFontScaling={false}>다시 불러오기</Text>
              </Pressable>
            </View>

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
    maxHeight: "100%",
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,

  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  toolbarBtn: {
    ...uiThemeFontStyle,
    color: "#6ae",
    minHeight: 44,
    paddingVertical: 10,
    fontSize: 16,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
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
