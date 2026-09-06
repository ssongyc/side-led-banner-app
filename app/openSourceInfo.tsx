import {
  openSourceInfoStyles,
  settingsStyles,
} from "@/constants/settingsStyles";
import { styles as base } from "@/constants/styles";
import { useSettingsRest } from "@/contexts/settingsContext";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import pkg from "../package.json";

function stripVersionPrefix(v: string): string {
  return v.replace(/^[\^~>=<\s]+/, "").trim();
}

type OssEntry = { name: string; version: string };

export default function OpenSourceInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { textSectionLabel } = useSettingsRest();

  const entries = useMemo<OssEntry[]>(() => {
    const deps = (pkg as { dependencies?: Record<string, string> })
      .dependencies;
    if (!deps) return [];
    return Object.entries(deps)
      .map(([name, version]) => ({
        name: name.replace(/^@/, ""),
        version: stripVersionPrefix(version),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <View style={[base.container, { paddingTop: insets.top }]}>
      <View style={settingsStyles.headerInline}>
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
        <Text style={settingsStyles.titleText} allowFontScaling={false}>
          {textSectionLabel("openSourceInfo")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={base.scrollViewContainer}
      >
        {entries.map(({ name, version }) => (
          <View key={name} style={openSourceInfoStyles.row}>
            <Text
              style={openSourceInfoStyles.nameText}
              numberOfLines={1}
              ellipsizeMode="middle"
              allowFontScaling={false}
            >
              {name}
            </Text>
            <Text
              style={openSourceInfoStyles.versionText}
              allowFontScaling={false}
            >
              {version}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

