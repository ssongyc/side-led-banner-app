import {
  Canvas,
  FillType,
  FilterMode,
  ImageFormat,
  MipmapMode,
  Path,
  Rect,
  Image as SkiaImage,
  Skia,
  type SkImage,
} from "@shopify/react-native-skia";
import { File, Paths } from "expo-file-system";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Modal,
  PanResponder,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsLocalizationContext } from "../../contexts/settingsContext";
import { hideAndroidNavigationBar } from "@/utils/SystemChrome";

type PhotoCropOrientation = "landscape" | "portrait";

type CropTransform = { scale: number; x: number; y: number };

type GestureBase = CropTransform & {
  touches: number;
  pageX: number;
  pageY: number;
  distance: number;
};

type FrameResizeBase = {
  frameScale: number;
  distance: number;
  centerPageX: number;
  centerPageY: number;
};

const FRAME_MARGIN = 24;
const MAX_ZOOM = 5;
const OUTPUT_JPEG_QUALITY = 85;
const MIN_FRAME_SCALE = 0.25;
const CORNER_HIT_RADIUS = 28;
const CORNER_HANDLE_SIZE = 14;

const screenCropAspect = (orientation: PhotoCropOrientation) => {
  const { width, height } = Dimensions.get("screen");
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  return orientation === "landscape" ? long / short : short / long;
};

const screenLongSidePx = () => {
  const { width, height } = Dimensions.get("screen");
  return Math.round(Math.max(width, height) * PixelRatio.get());
};

const touchCenter = (event: GestureResponderEvent) => {
  const touches = event.nativeEvent.touches;
  if (touches.length >= 2) {
    const [a, b] = touches;
    return {
      touches: 2,
      pageX: (a.pageX + b.pageX) / 2,
      pageY: (a.pageY + b.pageY) / 2,
      distance: Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY),
    };
  }
  const touch = touches[0] ?? event.nativeEvent;
  return { touches: 1, pageX: touch.pageX, pageY: touch.pageY, distance: 0 };
};

interface CropModalProps {
  sourceUri: string;
  onCancel: () => void;
  onDone: (uri: string) => void;
}

export const CropModal = ({ sourceUri, onCancel, onDone }: CropModalProps) => {
  const { textSectionLabel } = useSettingsLocalizationContext();
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<SkImage | null>(null);
  const [orientation, setOrientation] = useState<PhotoCropOrientation>("landscape");
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState<CropTransform>({ scale: 1, x: 0, y: 0 });
  const [frameScale, setFrameScale] = useState(1);
  const transformRef = useRef(transform);
  const frameScaleRef = useRef(frameScale);
  const gestureBaseRef = useRef<GestureBase | null>(null);
  const frameResizeBaseRef = useRef<FrameResizeBase | null>(null);

  useEffect(() => {
    let cancelled = false;
    Skia.Data.fromURI(sourceUri)
      .then((data) => {
        if (cancelled) return;
        const decoded = Skia.Image.MakeImageFromEncoded(data);
        if (!decoded) throw new Error(`Failed to decode image: ${sourceUri}`);
        setImage(decoded);
      })
      .catch((error: unknown) => {
        if (__DEV__) console.warn("[PhotoCrop] load failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, [sourceUri]);

  const fullFrame = useMemo(() => {
    const aspect = screenCropAspect(orientation);
    const maxWidth = stage.width - FRAME_MARGIN * 2;
    const maxHeight = stage.height - FRAME_MARGIN * 2;
    const width = Math.max(0, Math.min(maxWidth, maxHeight * aspect));
    const height = width / aspect;
    return {
      width,
      height,
      x: (stage.width - width) / 2,
      y: (stage.height - height) / 2,
    };
  }, [orientation, stage]);

  const frame = useMemo(() => {
    const width = fullFrame.width * frameScale;
    const height = fullFrame.height * frameScale;
    return {
      width,
      height,
      x: (stage.width - width) / 2,
      y: (stage.height - height) / 2,
    };
  }, [frameScale, fullFrame, stage]);

  const frameReady = frame.width > 0 && frame.height > 0;
  const minScale = image && frameReady
    ? Math.max(fullFrame.width / image.width(), fullFrame.height / image.height())
    : 1;

  const clampTransform = useCallback(
    (next: CropTransform): CropTransform => {
      if (!image) return next;
      const scale = Math.min(Math.max(next.scale, minScale), minScale * MAX_ZOOM);
      const frameWidth = fullFrame.width * frameScaleRef.current;
      const frameHeight = fullFrame.height * frameScaleRef.current;
      const limitX = Math.max(0, (image.width() * scale - frameWidth) / 2);
      const limitY = Math.max(0, (image.height() * scale - frameHeight) / 2);
      return {
        scale,
        x: Math.min(Math.max(next.x, -limitX), limitX),
        y: Math.min(Math.max(next.y, -limitY), limitY),
      };
    },
    [fullFrame, image, minScale],
  );

  const applyTransform = useCallback((next: CropTransform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);

  const applyFrameScale = useCallback((next: number) => {
    frameScaleRef.current = next;
    setFrameScale(next);
  }, []);

  useEffect(() => {
    // Keep the gesture refs and displayed transform in sync when the crop geometry changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyFrameScale(1);
    applyTransform({ scale: minScale, x: 0, y: 0 });
  }, [applyFrameScale, applyTransform, minScale, orientation]);

  const rebaseGesture = useCallback((event: GestureResponderEvent) => {
    gestureBaseRef.current = { ...transformRef.current, ...touchCenter(event) };
  }, []);

  const panResponder = useMemo(
    () =>
      // PanResponder stores these callbacks and reads their refs only during gestures.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY, pageX, pageY } = event.nativeEvent;
          const offsetX = locationX - stage.width / 2;
          const offsetY = locationY - stage.height / 2;
          const halfWidth = (fullFrame.width * frameScaleRef.current) / 2;
          const halfHeight = (fullFrame.height * frameScaleRef.current) / 2;
          const distance = Math.hypot(offsetX, offsetY);
          const isOnCorner =
            Math.abs(Math.abs(offsetX) - halfWidth) <= CORNER_HIT_RADIUS &&
            Math.abs(Math.abs(offsetY) - halfHeight) <= CORNER_HIT_RADIUS;
          if (isOnCorner && distance > 0) {
            frameResizeBaseRef.current = {
              frameScale: frameScaleRef.current,
              distance,
              centerPageX: pageX - offsetX,
              centerPageY: pageY - offsetY,
            };
            return;
          }
          rebaseGesture(event);
        },
        onPanResponderMove: (event) => {
          const resizeBase = frameResizeBaseRef.current;
          if (resizeBase) {
            const { pageX, pageY } = event.nativeEvent;
            const distance = Math.hypot(
              pageX - resizeBase.centerPageX,
              pageY - resizeBase.centerPageY,
            );
            applyFrameScale(
              Math.min(
                1,
                Math.max(
                  MIN_FRAME_SCALE,
                  (resizeBase.frameScale * distance) / resizeBase.distance,
                ),
              ),
            );
            applyTransform(clampTransform(transformRef.current));
            return;
          }
          const current = touchCenter(event);
          const base = gestureBaseRef.current;
          if (!base || base.touches !== current.touches) {
            rebaseGesture(event);
            return;
          }
          const zoom =
            current.touches === 2 && base.distance > 0
              ? current.distance / base.distance
              : 1;
          applyTransform(
            clampTransform({
              scale: base.scale * zoom,
              x: base.x * zoom + current.pageX - base.pageX,
              y: base.y * zoom + current.pageY - base.pageY,
            }),
          );
        },
        onPanResponderRelease: () => {
          gestureBaseRef.current = null;
          frameResizeBaseRef.current = null;
        },
        onPanResponderTerminate: () => {
          gestureBaseRef.current = null;
          frameResizeBaseRef.current = null;
        },
      }),
    [applyFrameScale, applyTransform, clampTransform, fullFrame, rebaseGesture, stage],
  );

  const onStageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setStage({ width, height });
  }, []);

  const saveCrop = useCallback(() => {
    if (!image || !frameReady) return;
    try {
      const { scale, x, y } = transformRef.current;
      const cropWidth = frame.width / scale;
      const cropHeight = frame.height / scale;
      const cropX = (image.width() * scale - frame.width) / 2 / scale - x / scale;
      const cropY = (image.height() * scale - frame.height) / 2 / scale - y / scale;
      const outputScale = Math.min(1, screenLongSidePx() / Math.max(cropWidth, cropHeight));
      const outputWidth = Math.max(1, Math.round(cropWidth * outputScale));
      const outputHeight = Math.max(1, Math.round(cropHeight * outputScale));

      const surface = Skia.Surface.Make(outputWidth, outputHeight);
      if (!surface) throw new Error("Failed to create crop surface");
      surface.getCanvas().drawImageRectOptions(
        image,
        Skia.XYWHRect(cropX, cropY, cropWidth, cropHeight),
        Skia.XYWHRect(0, 0, outputWidth, outputHeight),
        FilterMode.Linear,
        MipmapMode.Linear,
      );
      surface.flush();
      const bytes = surface
        .makeImageSnapshot()
        .encodeToBytes(ImageFormat.JPEG, OUTPUT_JPEG_QUALITY);
      if (bytes.length === 0) throw new Error("Failed to encode cropped image");

      const file = new File(Paths.cache, `background-${Date.now()}.jpg`);
      file.write(bytes);
      onDone(file.uri);
    } catch (error) {
      if (__DEV__) console.warn("[PhotoCrop] save failed", error);
    }
  }, [frame, frameReady, image, onDone]);

  const dimPath = useMemo(() => {
    if (!image || !frameReady) return null;
    return Skia.PathBuilder.Make()
      .addRect(Skia.XYWHRect(0, 0, stage.width, stage.height))
      .addRect(Skia.XYWHRect(frame.x, frame.y, frame.width, frame.height))
      .setFillType(FillType.EvenOdd)
      .build();
  }, [frame, frameReady, image, stage]);

  const imageWidth = image ? image.width() * transform.scale : 0;
  const imageHeight = image ? image.height() * transform.scale : 0;

  return (
    <Modal
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onShow={hideAndroidNavigationBar}
      onRequestClose={onCancel}
    >
      <View style={styles.root} onTouchStart={hideAndroidNavigationBar}>
        <View style={[styles.toolbar, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.toolbarButton} onPress={onCancel}>
            <Text style={styles.toolbarText} allowFontScaling={false}>
              {textSectionLabel("cancel")}
            </Text>
          </TouchableOpacity>
          <View style={styles.segment}>
            {(["landscape", "portrait"] as const).map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.segmentItem, orientation === value && styles.segmentItemActive]}
                onPress={() => setOrientation(value)}
              >
                <Text
                  style={[styles.segmentText, orientation === value && styles.segmentTextActive]}
                  allowFontScaling={false}
                >
                  {textSectionLabel(value === "landscape" ? "photoLandscape" : "photoPortrait")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={saveCrop}
            disabled={!dimPath}
          >
            <Text
              style={[styles.toolbarText, styles.toolbarTextRight, !dimPath && styles.toolbarTextDisabled]}
              allowFontScaling={false}
            >
              {textSectionLabel("done")}
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={[styles.stage, { marginBottom: insets.bottom }]}
          onLayout={onStageLayout}
          {...panResponder.panHandlers}
        >
          {image && dimPath ? (
            <Canvas style={StyleSheet.absoluteFill}>
              <SkiaImage
                image={image}
                x={stage.width / 2 + transform.x - imageWidth / 2}
                y={stage.height / 2 + transform.y - imageHeight / 2}
                width={imageWidth}
                height={imageHeight}
                fit="fill"
              />
              <Path path={dimPath} color="rgba(0, 0, 0, 0.6)" />
              <Rect
                x={frame.x}
                y={frame.y}
                width={frame.width}
                height={frame.height}
                color="#FFFFFF"
                style="stroke"
                strokeWidth={2}
              />
              {[frame.x, frame.x + frame.width].flatMap((cornerX) =>
                [frame.y, frame.y + frame.height].map((cornerY, index) => (
                  <Rect
                    key={`${cornerX === frame.x ? "left" : "right"}-${index}`}
                    x={cornerX - CORNER_HANDLE_SIZE / 2}
                    y={cornerY - CORNER_HANDLE_SIZE / 2}
                    width={CORNER_HANDLE_SIZE}
                    height={CORNER_HANDLE_SIZE}
                    color="#FFFFFF"
                  />
                )),
              )}
            </Canvas>
          ) : (
            <ActivityIndicator style={StyleSheet.absoluteFill} color="#FFFFFF" />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  toolbarButton: {
    minWidth: 72,
    paddingVertical: 14,
  },
  toolbarText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  toolbarTextRight: {
    textAlign: "right",
    fontWeight: "600",
  },
  toolbarTextDisabled: {
    opacity: 0.4,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  segmentItem: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  segmentItemActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  segmentTextActive: {
    color: "#000000",
  },
  stage: {
    flex: 1,
    overflow: "hidden",
  },
});
