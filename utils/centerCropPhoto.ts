import {
  FilterMode,
  ImageFormat,
  MipmapMode,
  Skia,
} from "@shopify/react-native-skia";
import { File, Paths } from "expo-file-system";
import { Dimensions, PixelRatio } from "react-native";

const OUTPUT_JPEG_QUALITY = 85;

export async function centerCropPhoto(sourceUri: string): Promise<string> {
  const data = await Skia.Data.fromURI(sourceUri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  data.dispose();
  if (!image) throw new Error(`Failed to decode image: ${sourceUri}`);
  try {
    const imageWidth = image.width();
    const imageHeight = image.height();
    const { width, height } = Dimensions.get("screen");
    const screenLong = Math.max(width, height);
    const screenShort = Math.min(width, height);
    const aspect =
      imageWidth >= imageHeight ? screenLong / screenShort : screenShort / screenLong;
    const cropWidth = Math.min(imageWidth, imageHeight * aspect);
    const cropHeight = cropWidth / aspect;
    const cropX = (imageWidth - cropWidth) / 2;
    const cropY = (imageHeight - cropHeight) / 2;
    const outputScale = Math.min(
      1,
      Math.round(screenLong * PixelRatio.get()) / Math.max(cropWidth, cropHeight),
    );
    const outputWidth = Math.max(1, Math.round(cropWidth * outputScale));
    const outputHeight = Math.max(1, Math.round(cropHeight * outputScale));

    const surface = Skia.Surface.Make(outputWidth, outputHeight);
    if (!surface) throw new Error("Failed to create crop surface");
    try {
      surface.getCanvas().drawImageRectOptions(
        image,
        Skia.XYWHRect(cropX, cropY, cropWidth, cropHeight),
        Skia.XYWHRect(0, 0, outputWidth, outputHeight),
        FilterMode.Linear,
        MipmapMode.Linear,
      );
      surface.flush();
      const snapshot = surface.makeImageSnapshot();
      const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, OUTPUT_JPEG_QUALITY);
      snapshot.dispose();
      if (bytes.length === 0) throw new Error("Failed to encode cropped image");

      const file = new File(Paths.cache, `background-${Date.now()}.jpg`);
      file.write(bytes);
      return file.uri;
    } finally {
      surface.dispose();
    }
  } finally {
    image.dispose();
  }
}
