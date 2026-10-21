import React, { type PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

export function PlaybackTextLayer({
  layoutRevision: _layoutRevision,
  ...props
}: PropsWithChildren<ViewProps & { layoutRevision: string }>) {
  return <View {...props} />;
}
