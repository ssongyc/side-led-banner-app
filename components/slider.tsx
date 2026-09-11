import {
  SliderMinusButton,
  SliderPlusButton,
} from "@/assets/svg/sliderButtons";
import {
  sliderComponentStyles as styles,
  sliderLockStyles as lockStyles,
} from "@/constants/styles";
import { Slider } from "@miblanchard/react-native-slider";
import { useCallback, useRef, useState } from "react";
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
  const [isSliding, setIsSliding] = useState(false);
  const dragStartValue = useRef(value);

  const normalizeValue = useCallback(
    (nextValue: number | number[]) =>
      Math.round(
        Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue,
      ),
    [value],
  );

  const handleSlidingStart = useCallback(() => {
    dragStartValue.current = value;
    setIsSliding(true);
  }, [value]);

  const handleSlidingComplete = useCallback(() => {
    setIsSliding(false);
  }, []);

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
        disabled={disabled || locked}
        trackClickable
        containerStyle={styles.slider}
        trackStyle={styles.sliderTrack}
        thumbStyle={styles.sliderThumb}
        maximumValue={maximumValue}
        minimumValue={minimumValue}
        step={step}
        value={isSliding ? dragStartValue.current : value}
        onSlidingStart={handleSlidingStart}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={(nextValue) => onChange(normalizeValue(nextValue))}
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
