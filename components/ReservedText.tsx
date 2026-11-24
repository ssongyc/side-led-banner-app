import { rewardAdModalStyles as styles } from "@/constants/styles";
import { type StyleProp, type TextStyle, Text, View } from "react-native";

export function ReservedText({ text, variants, textStyle, centerVertically }: {
  text: string;
  variants: readonly string[];
  textStyle: StyleProp<TextStyle>;
  centerVertically?: boolean;
}) {
  return (
    <View style={styles.reservedText}>
      {/* Overlap the hidden variants so the tallest one reserves space on first layout. */}
      <View style={styles.reservedTextRow} pointerEvents="none"
        accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        {[...variants, text].map((variant, index) => (
          <Text key={index} allowFontScaling={false}
            style={[textStyle, styles.reservedTextCopy]}>{variant}</Text>
        ))}
      </View>
      <View style={[styles.reservedTextVisible, centerVertically && styles.reservedTextCentered]}>
        <Text style={textStyle} allowFontScaling={false} accessibilityLiveRegion="polite">
          {text}
        </Text>
      </View>
    </View>
  );
}
