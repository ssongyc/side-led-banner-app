import { type PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

export function PlaybackTextLayer({
  layoutRevision: _layoutRevision,
  rotationMode: _rotationMode,
  onDeviceRotation: _onDeviceRotation,
  ...props
}: PropsWithChildren<ViewProps & {
  layoutRevision: string;
  rotationMode: "device" | "paused";
  onDeviceRotation?: (event: { nativeEvent: { degrees: number } }) => void;
}>) {
  return <View {...props} />;
}
