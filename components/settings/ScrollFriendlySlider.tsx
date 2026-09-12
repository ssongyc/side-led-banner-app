import { Slider } from "@miblanchard/react-native-slider";
import { useMemo, useRef, useState } from "react";
import { PanResponder, View, type ViewStyle } from "react-native";

type Props = {
  value: number[]; minimumValue: number; maximumValue: number; step: number;
  disabled?: boolean; trackClickable?: boolean;
  containerStyle: ViewStyle; trackStyle: ViewStyle; thumbStyle: ViewStyle;
  minimumTrackTintColor: string;
  onSlidingStart: () => void;
  onSlidingComplete: (values: number[]) => void;
  onValueChange: (values: number[]) => void;
};

// Keep the existing slider artwork; arbitrate gestures before it can claim touches.
export function ScrollFriendlySlider(props: Props) {
  const latest = useRef(props);
  latest.current = props;
  const width = useRef(0);
  const touch = useRef({ x: 0, pageX: 0, pageY: 0, moved: false, vertical: false,
    active: false, offset: 0, value: props.value[0] });
  const [dragValue, setDragValue] = useState<number | null>(null);
  const helpers = useMemo(() => {
    const valueAt = (x: number) => {
      const p = latest.current;
      const thumbWidth = Number(p.thumbStyle.width);
      const trackWidth = width.current - thumbWidth;
      if (trackWidth <= 0) return p.value[0];
      const ratio = Math.max(0, Math.min(1, (x - thumbWidth / 2 - touch.current.offset) / trackWidth));
      return p.minimumValue + ratio * (p.maximumValue - p.minimumValue);
    };
    const update = (x: number) => {
      const next = valueAt(x);
      touch.current.value = next;
      setDragValue(next);
      latest.current.onValueChange([next]);
    };
    const finish = () => {
      if (!touch.current.active) return;
      touch.current.active = false;
      latest.current.onSlidingComplete([touch.current.value]);
      setDragValue(null);
    };
    return { update, finish, responder: PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) => {
        if (latest.current.disabled || gesture.numberActiveTouches !== 1) return false;
        const dx = Math.abs(gesture.dx), dy = Math.abs(gesture.dy);
        if (dy > 6 && dy >= dx) touch.current.vertical = true;
        return !touch.current.vertical && dx > 6 && dx > dy;
      },
      onPanResponderGrant: (_event, gesture) => {
        touch.current.active = true;
        touch.current.moved = true;
        latest.current.onSlidingStart();
        update(touch.current.x + gesture.dx);
      },
      onPanResponderMove: (_event, gesture) => {
        if (latest.current.disabled || gesture.numberActiveTouches !== 1) { finish(); return; }
        if (touch.current.active) update(touch.current.x + gesture.dx);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
      onPanResponderTerminationRequest: () => false,
    }) };
  }, []);
  return (
    <View style={props.containerStyle} onLayout={event => { width.current = event.nativeEvent.layout.width; }}
      {...helpers.responder.panHandlers}
      onTouchStart={event => {
        const p = latest.current, e = event.nativeEvent;
        if (e.touches.length !== 1) {
          touch.current.moved = true;
          touch.current.vertical = true;
          helpers.finish();
          return;
        }
        const thumbWidth = Number(p.thumbStyle.width);
        const range = p.maximumValue - p.minimumValue;
        const center = thumbWidth / 2 + (range > 0 ? (p.value[0] - p.minimumValue) / range : 0) * (width.current - thumbWidth);
        touch.current = { x: e.locationX, pageX: e.pageX, pageY: e.pageY,
          moved: e.touches.length !== 1, vertical: false, active: false,
          offset: Math.abs(e.locationX - center) <= thumbWidth / 2 ? e.locationX - center : 0,
          value: p.value[0] };
      }}
      onTouchMove={event => {
        const e = event.nativeEvent, t = touch.current;
        const dx = Math.abs(e.pageX - t.pageX), dy = Math.abs(e.pageY - t.pageY);
        if (dx > 6 || dy > 6) t.moved = true;
        if (!t.active && dy > 6 && dy >= dx) t.vertical = true;
      }}
      onTouchCancel={() => { touch.current.moved = true; helpers.finish(); }}
      onTouchEnd={() => {
        const t = touch.current;
        if (latest.current.disabled || t.moved || t.active || width.current <= 0) return;
        // A stationary track tap keeps the existing click-to-set behavior.
        t.moved = true;
        latest.current.onSlidingStart();
        t.active = true;
        helpers.update(t.x);
        helpers.finish();
      }}>
      <View pointerEvents="none" style={{ flex: 1 }}>
        <Slider {...props} containerStyle={{ flex: 1 }} value={dragValue === null ? props.value : [dragValue]} disabled />
      </View>
    </View>
  );
}
