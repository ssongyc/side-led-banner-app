import {
  SliderMinusButton,
  SliderPlusButton,
} from "@/assets/svg/sliderButtons";
import {
  sliderComponentStyles as styles,
  sliderLockStyles as lockStyles,
} from "@/constants/styles";
import { Slider } from "@miblanchard/react-native-slider";
import { useCallback, useMemo, useRef, useState } from "react";
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

  const controlledValue = isSliding ? dragStartValue.current : value;
  // A new array at release also snaps a sub-step drag back to its stored value.
  const sliderValue = useMemo(() => [controlledValue], [controlledValue, isSliding]);

  const lastEmittedValue = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  if (!isSliding) lastEmittedValue.current = value;

  // Keep thumb motion continuous without rebuilding the preview for the same step.
  const handleValueChange = useCallback(
    (values: number[]) => {
      const raw = values[0];
      if (raw === undefined || !Number.isFinite(raw)) return;
      const stepped = step > 0
        ? minimumValue + Math.round((raw - minimumValue) / step) * step
        : raw;
      const next = Math.max(minimumValue, Math.min(maximumValue, Math.round(stepped)));
      if (next === lastEmittedValue.current) return;
      lastEmittedValue.current = next;
      onChangeRef.current(next);
    },
    [minimumValue, maximumValue, step],
  );

  const handleSlidingStart = useCallback(() => {
    dragStartValue.current = value;
    setIsSliding(true);
  }, [value]);

  const handleSlidingComplete = useCallback((values: number[]) => {
    handleValueChange(values);
    setIsSliding(false);
  }, [handleValueChange]);

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
        step={0}
        value={sliderValue}
        onSlidingStart={handleSlidingStart}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
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
