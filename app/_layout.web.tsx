import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import React from "react";

export default function WebRootLayout() {
  if (typeof window === "undefined") return null;

  return (
    <WithSkiaWeb getComponent={() => import("@/components/RootLayout")} />
  );
}
