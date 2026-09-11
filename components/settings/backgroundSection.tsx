import { backgroundColorPalette } from "@/constants/colorPalette";
import { styles as base, colorPickerLockStyles as bgLock, colorPickerStyles as chip } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback } from "react";
import {
  Alert,
  Image as RNImage,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSettingsRest } from "../../contexts/settingsContext";
import { SettingsSliderBlock } from "./settingsSliderBlock";

const LOCK_ICON = require("@/assets/images/icon_lock_type2.png");
const COLS = 9;
const ROW1_SWATCHES = COLS - 1;
const PHOTO_BUTTON_HIT_SLOP = { top: 6, right: 6, bottom: 6, left: 6 } as const;

// The palette is fixed; build its display rows once per module load.
const colors = backgroundColorPalette;
const row1 = colors.slice(0, ROW1_SWATCHES);
const tail = colors.slice(ROW1_SWATCHES);
const moreRows: string[][] = [];
for (let i = 0; i < tail.length; i += COLS) {
  moreRows.push(tail.slice(i, i + COLS));
}



export const BackgroundSection = () => {
  const { config, updateConfig, textSectionLabel, isProActive, openRewardAdModal } = useSettingsRest();
  const { backgroundColor, backgroundBlur, backgroundImageUri } =
    config.background;

  const setBackgroundBlur = (value: number) =>
    updateConfig("background", { backgroundBlur: value });

  const setBgColor = (color: string) =>
    updateConfig("background", {
      backgroundColor: color,
      backgroundImageUri: null,
    });

  const openAlbum = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission",
        "Allow photo library access to choose a background image.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
      aspect: [16, 9],
    });
    if (result.canceled || !result.assets[0]) return;
    updateConfig("background", {
      backgroundImageUri: result.assets[0].uri,
    });
  }, [updateConfig]);



  const hasBgPhoto = backgroundImageUri != null && backgroundImageUri !== "";

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        directionalLockEnabled
        delaysContentTouches={false}
        canCancelContentTouches={false}
        contentContainerStyle={base.scrollViewContainer}
      >
        <View
          style={[base.settingsRow, { borderBottomWidth: 0, marginBottom: 0 }]}
        >
          <Text style={base.settingsRowLabel} allowFontScaling={false}>
            {textSectionLabel("backgroundColor")}
          </Text>
        </View>

        <View style={chip.colorPickerContainer}>
          <View style={chip.colorPickerRow}>
            <TouchableOpacity
              style={chip.colorPickerItemButton}
              hitSlop={PHOTO_BUTTON_HIT_SLOP}
              activeOpacity={0.65}
              onPress={() => void openAlbum()}
              accessibilityRole="button"
              accessibilityLabel="Background photo"
            >
              {hasBgPhoto ? (
                <Image
                  source={{ uri: backgroundImageUri! }}
                  style={[chip.colorPickerItem, { overflow: "hidden" }]}
                  contentFit="cover"
                />
              ) : (
                <View style={[chip.colorPickerItem, chip.photoEmpty]}>
                  <Ionicons name="image-outline" size={18} color="#555" />
                </View>
              )}
              {hasBgPhoto ? <View style={chip.colorPickerItemActive} /> : null}
            </TouchableOpacity>
            {row1.map((color, index) => {
              const isLocked = !isProActive && index >= 3;
              return (
                <TouchableOpacity
                  key={`bg-color-first-${index}`}
                  style={chip.colorPickerItemButton}
                  onPress={() => (isLocked ? openRewardAdModal() : setBgColor(color))}
                >
                  {!isLocked && !hasBgPhoto && backgroundColor === color ? (
                    <View style={chip.colorPickerItemActive} />
                  ) : null}
                  <View style={[chip.colorPickerItem, { backgroundColor: color }]} />
                  {isLocked && (
                    <>
                      <View style={bgLock.overlay} />
                      <RNImage source={LOCK_ICON} style={bgLock.icon} />
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {moreRows.map((row, rowIndex) => (
            <View key={`bg-color-row-${rowIndex}`} style={chip.colorPickerRow}>
              {row.map((color, index) => {
                const isLocked = !isProActive && index >= 4;
                return (
                  <TouchableOpacity
                    key={`bg-color-${rowIndex}-${index}`}
                    style={chip.colorPickerItemButton}
                    onPress={() => (isLocked ? openRewardAdModal() : setBgColor(color))}
                  >
                    {!isLocked && !hasBgPhoto && backgroundColor === color ? (
                      <View style={chip.colorPickerItemActive} />
                    ) : null}
                    <View style={[chip.colorPickerItem, { backgroundColor: color }]} />
                    {isLocked && (
                      <>
                        <View style={bgLock.overlay} />
                        <RNImage source={LOCK_ICON} style={bgLock.icon} />
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <SettingsSliderBlock
          label={textSectionLabel("blur")}
          value={backgroundBlur}
          onChange={setBackgroundBlur}
          minimumValue={0}
          maximumValue={100}
          step={1}
        />
      </ScrollView>
    </>
  );
};
