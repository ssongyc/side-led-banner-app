// components/TextSection.tsx
import { ColorPicker } from "@/components/colorPicker";
import { btnStyles } from "@/constants/btnStyles";
import { textColorPalette } from "@/constants/colorPalette";
import { getDefaultForLocale } from "@/constants/appFonts";
import { resolvePixelFontSizeSliderMinPercent } from "@/constants/pixelLed";
import { resolveDropdownMaxHeight, styles } from "@/constants/styles";
import { FONT_SIZE_MIN } from "@/utils/textSizing";
import { requestFontDownload } from "@/utils/remoteFontDownloadPrompt";
import type { FontId } from "@/constants/appFonts";
import { normalizeOneLineJoinMode } from "@/utils/viewMode";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import {
  useSettingsAppearance,
  useSettingsContent,
  useSettingsLocalizationContext,
  useSettingsMotion,
  useSettingsUI,
} from "../../contexts/settingsContext";
import { SettingsSliderBlock } from "./settingsSliderBlock";

export const TextSection = () => {
  const { height: windowH } = useWindowDimensions();

  /** 드롭다운너비측정용 */
  const [maxFontLabelWidth, setMaxFontLabelWidth] = useState(0);
  const [fontDropdownContentHeight, setFontDropdownContentHeight] = useState(0);
  /** 다운로드 취소/실패 시 드롭다운 내부 선택 상태를 실제 값으로 되돌리기 위한 강제 리마운트 키 */
  const [fontDropdownResetKey, setFontDropdownResetKey] = useState(0);
  const onFontLabelLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const w = e.nativeEvent.layout.width;
      setMaxFontLabelWidth((prev) => (w > prev ? w : prev));
    },
    [],
  );
  const fontDropdownWidth = useMemo(() => {
    if (!maxFontLabelWidth) return undefined;
    const ICON_WIDTH = 30; // dropdownIconStyle.width
    const HORIZONTAL_PADDING = 10 * 2; // dropdownContainer.paddingHorizontal
    const BUFFER = 24; 
    return Math.ceil(maxFontLabelWidth) + ICON_WIDTH + HORIZONTAL_PADDING + BUFFER;
  }, [maxFontLabelWidth]);
  const renderFontItem = useCallback(
    (item: { label: string; value: string }) => (
      <View style={styles.dropdownItemContent}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          ellipsizeMode="clip"
          style={styles.dropdownItemTextStyle}
        >
          {item.label}
        </Text>
      </View>
    ),
    [],
  );

  const { appearance, updateConfig, fontItems } = useSettingsAppearance();
  const { content } = useSettingsContent();
  const { motion } = useSettingsMotion();
  const { textSectionLabel, resolvedAppLocale } =
    useSettingsLocalizationContext();
  const { isProActive, openRewardAdModal, ui } = useSettingsUI();

  const fontDropdownMaxHeight = useMemo(
    () => resolveDropdownMaxHeight(fontDropdownContentHeight, windowH),
    [fontDropdownContentHeight, windowH],
  );

  const fontDropdownFlatListProps = useMemo(
    () => ({
      contentContainerStyle: { paddingBottom: 0 },
    }),
    [],
  );

  const { playOption, oneLineJoinMode: oneLineJoinModeRaw } = content;
  const oneLineJoinMode = normalizeOneLineJoinMode(oneLineJoinModeRaw);
  const {
    font,
    fontSize,
    lineSpacing,
    letterSpacing,
    textSelectedColor,
    outLine,
    dropShadow,
  } = appearance;
  const { textMoveSpeed } = motion;

  const displayFontValue = useMemo(() => {
    if (fontItems.some((item) => item.value === font)) return font;
    return getDefaultForLocale(resolvedAppLocale);
  }, [font, fontItems, resolvedAppLocale]);
  const { effectSelectedItems } = appearance;
  const isPixelEffect = effectSelectedItems.includes("Pixel");
  const fontSizeSliderMin = useMemo(
    () =>
      isPixelEffect
        ? resolvePixelFontSizeSliderMinPercent({
            playOption,
            locale: resolvedAppLocale,
            sliderFloor: FONT_SIZE_MIN,
          })
        : FONT_SIZE_MIN,
    [isPixelEffect, playOption, resolvedAppLocale],
  );

  useEffect(() => {
    if (fontSize < fontSizeSliderMin) {
      updateConfig("appearance", { fontSize: fontSizeSliderMin });
    }
  }, [fontSize, fontSizeSliderMin, updateConfig]);

  const onFontChange = (item: { value: string }) => {
    const nextFont = item.value;
    requestFontDownload(nextFont as FontId).then((downloaded) => {
      if (downloaded) {
        updateConfig("appearance", { font: nextFont });
      } else {
        // 취소/실패 시 라이브러리가 낙관적으로 바꿔둔 선택 표시를 실제 값으로 되돌림
        setFontDropdownResetKey((k) => k + 1);
      }
    });
  };
  const setTextMoveSpeed = (value: number) =>
    updateConfig("motion", { textMoveSpeed: value });
  const setFontSize = (value: number) =>
    updateConfig("appearance", {
      fontSize: Math.max(fontSizeSliderMin, value),
    });
  const setLineSpacing = (value: number) =>
    updateConfig("appearance", { lineSpacing: Math.max(0, value) });
  const setLetterSpacing = (value: number) =>
    updateConfig("appearance", { letterSpacing: Math.max(0, value) });
  const setTextSelectedColor = (color: string) =>
    updateConfig("appearance", { textSelectedColor: color });
  const setOutLine = (value: number) =>
    updateConfig("appearance", { outLine: value });
  const setDropShadow = (value: number) =>
    updateConfig("appearance", { dropShadow: value });
  const setOneLineJoinMode = (value: "space6" | "lineClear") =>
    updateConfig("content", { oneLineJoinMode: value });

  return (
    <ScrollView
      style={styles.settingsPanelContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollViewContainer}
      keyboardShouldPersistTaps="handled"
      directionalLockEnabled
      canCancelContentTouches
    >
      {/* text - font select */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingsRowLabel} allowFontScaling={false}>
          {textSectionLabel("font")}
        </Text>
        {/* 드롭다운 항목과 동일 스타일로 폭·높이 측정 */}
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
              setFontDropdownContentHeight(e.nativeEvent.layout.height)
            }
          >
            {fontItems.map((item) => (
              <View
                key={item.value}
                style={styles.dropdownItemContainerStyle}
              >
                <View style={styles.dropdownItemContent}>
                  <Text
                    style={styles.dropdownItemTextStyle}
                    allowFontScaling={false}
                    onLayout={onFontLabelLayout}
                  >
                    {item.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <Dropdown
          key={fontDropdownResetKey}
          data={fontItems}
          labelField="label"
          valueField="value"
          placeholder={textSectionLabel("fontPlaceholder")}
          iconColor="black"
          value={displayFontValue}
          onChange={onFontChange}
          maxHeight={fontDropdownMaxHeight}
          showsVerticalScrollIndicator
          flatListProps={fontDropdownFlatListProps}
          style={[
            styles.dropdownContainer,
            fontDropdownWidth ? { width: fontDropdownWidth } : null,
          ]}
          containerStyle={[
            styles.dropdownContainer,
            styles.dropdownMenuContainer,
            fontDropdownWidth ? { width: fontDropdownWidth } : null,
          ]}
          selectedTextStyle={styles.dropdownSelectedTextStyle}
          selectedTextProps={{ allowFontScaling: false, numberOfLines: 1 }}
          itemContainerStyle={styles.dropdownItemContainerStyle}
          itemTextStyle={styles.dropdownItemTextStyle}
          renderItem={renderFontItem}
          iconStyle={styles.dropdownIconStyle}
          placeholderStyle={styles.dropdownPlaceholderStyle}
        />
      </View>

      <SettingsSliderBlock
        label={textSectionLabel("speed")}
        value={textMoveSpeed}
        onChange={setTextMoveSpeed}
        minimumValue={0}
        maximumValue={100}
        step={1}
      />

      <SettingsSliderBlock
        slotId="fontSize"
        label={textSectionLabel("size")}
        value={fontSize}
        onChange={setFontSize}
        minimumValue={fontSizeSliderMin}
        maximumValue={100}
        step={1}
        locked={!isProActive}
        onLockedPress={openRewardAdModal}
      />
      <SettingsSliderBlock
        label={textSectionLabel("letterSpacing")}
        value={letterSpacing}
        onChange={setLetterSpacing}
        minimumValue={0}
        maximumValue={40}
        step={1}
      />
      {playOption === "multi" ? (
        <SettingsSliderBlock
          label={textSectionLabel("lineSpacing")}
          value={Math.min(lineSpacing, ui.lineSpacingSliderMax)}
          onChange={setLineSpacing}
          minimumValue={0}
          maximumValue={ui.lineSpacingSliderMax}
          step={1}
        />
      ) : null}

      <View style={styles.settingsRow}>
        <Text style={styles.settingsRowLabel} allowFontScaling={false}>
          {textSectionLabel("viewMode")}
        </Text>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setOneLineJoinMode("space6")}
            style={[
              btnStyles.effectItemButton,
              oneLineJoinMode === "space6" && btnStyles.effectItemButtonActive,
            ]}
          >
            <Text
              style={[
                btnStyles.effectItemButtonText,
                oneLineJoinMode === "space6" &&
                  btnStyles.effectItemButtonTextActive,
              ]}
              allowFontScaling={false}
            >
              {textSectionLabel("viewModeReset")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setOneLineJoinMode("lineClear")}
            style={[
              btnStyles.effectItemButton,
              oneLineJoinMode === "lineClear" &&
                btnStyles.effectItemButtonActive,
            ]}
          >
            <Text
              style={[
                btnStyles.effectItemButtonText,
                oneLineJoinMode === "lineClear" &&
                  btnStyles.effectItemButtonTextActive,
              ]}
              allowFontScaling={false}
            >
              {textSectionLabel("viewModeContinuous")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* text - color picker */}
      <View
        style={[styles.settingsRow, { borderBottomWidth: 0, marginBottom: 0 }]}
      >
        <Text style={styles.settingsRowLabel} allowFontScaling={false}>
          {textSectionLabel("color")}
        </Text>
      </View>
      <View style={styles.colorPickerContainer}>
        <ColorPicker
          colorList={textColorPalette}
          selectedColor={textSelectedColor}
          onColorSelect={setTextSelectedColor}
          lockedCount={isProActive ? 0 : 10}
          onLockedPress={openRewardAdModal}
        />
      </View>

      <SettingsSliderBlock
        label={textSectionLabel("outline")}
        value={outLine}
        onChange={setOutLine}
        minimumValue={0}
        maximumValue={100}
        step={1}
      />

      <SettingsSliderBlock
        label={textSectionLabel("dropShadow")}
        value={dropShadow}
        onChange={setDropShadow}
        minimumValue={0}
        maximumValue={100}
        step={1}
      />
    </ScrollView>
  );
};
