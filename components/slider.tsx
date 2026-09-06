import {
  SliderMinusButton,
  SliderPlusButton,
} from "@/assets/svg/sliderButtons";
import {
  sliderComponentStyles as styles,
  sliderLockStyles as lockStyles,
} from "@/constants/styles";
import { Slider } from "@miblanchard/react-native-slider";
import { Image, TouchableOpacity, View } from "react-native";

const LOCK_ICON = require("@/assets/images/icon_lock_type2.png");

export const SliderComponent = ({
  value,
  onChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 5,
  disabled = false,
  locked = false,
  onLockedPress,
}: {
  value: number;
  onChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
  disabled?: boolean;
  locked?: boolean;
  onLockedPress?: () => void;
}) => {
  return (
    <View style={styles.sliderContainer}>
      <TouchableOpacity
        style={styles.sliderButton}
        disabled={locked}
        onPress={() => onChange(Math.max(minimumValue, value - step))}
      >
        <SliderMinusButton />
      </TouchableOpacity>
      <Slider
        animateTransitions
        disabled={disabled || locked}
        trackClickable={true}
        trackStyle={styles.sliderTrack}
        thumbStyle={styles.sliderThumb}
        maximumValue={maximumValue}
        minimumValue={minimumValue}
        value={value}
        onValueChange={(nextValue) =>
          onChange(
            Math.round(
              Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue,
            ),
          )
        }
        minimumTrackTintColor="#FF6E00"
      />
      <TouchableOpacity
        style={styles.sliderButton}
        disabled={locked}
        onPress={() => onChange(Math.min(maximumValue, value + step))}
      >
        <SliderPlusButton />
      </TouchableOpacity>
      {locked && (
        <TouchableOpacity
          style={lockStyles.overlay}
          activeOpacity={1}
          onPress={onLockedPress}
        >
          <Image source={LOCK_ICON} style={lockStyles.icon} />
        </TouchableOpacity>
      )}
    </View>
  );
};
