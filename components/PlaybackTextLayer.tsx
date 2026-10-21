import { requireNativeViewManager } from "expo-modules-core";
import type { PropsWithChildren } from "react";
import type { ViewProps } from "react-native";

type PlaybackTextLayerProps = PropsWithChildren<ViewProps & {
  layoutRevision: string;
}>;

// A native boundary is required to hide text before the OS rotation snapshot.
export const PlaybackTextLayer =
  requireNativeViewManager<PlaybackTextLayerProps>("PlaybackTextLayer");
