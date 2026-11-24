import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Dimensions, PixelRatio } from "react-native";

const OUTPUT_JPEG_QUALITY = 0.95;

export async function centerCropPhoto(sourceUri: string): Promise<string> {
  const image = await ImageManipulator.manipulate(sourceUri).renderAsync();
  try {
    const imageWidth = image.width;
    const imageHeight = image.height;
    const { width, height } = Dimensions.get("screen");
    const screenLong = Math.max(width, height);
    const screenShort = Math.min(width, height);
    const aspect =
      imageWidth >= imageHeight ? screenLong / screenShort : screenShort / screenLong;
    const cropWidth = Math.min(imageWidth, Math.round(Math.min(imageWidth, imageHeight * aspect)));
    const cropHeight = Math.min(imageHeight, Math.round(cropWidth / aspect));
    const cropX = Math.floor((imageWidth - cropWidth) / 2);
    const cropY = Math.floor((imageHeight - cropHeight) / 2);
    const outputScale = Math.min(
      1,
      Math.round(screenLong * PixelRatio.get()) / Math.max(cropWidth, cropHeight),
    );
    const outputWidth = Math.max(1, Math.round(cropWidth * outputScale));
    const outputHeight = Math.max(1, Math.round(cropHeight * outputScale));

    const context = ImageManipulator.manipulate(image).crop({
      originX: cropX,
      originY: cropY,
      width: cropWidth,
      height: cropHeight,
    });
    if (outputWidth !== cropWidth || outputHeight !== cropHeight) {
      context.resize({ width: outputWidth, height: outputHeight });
    }
    const cropped = await context.renderAsync();
    try {
      const result = await cropped.saveAsync({
        format: SaveFormat.JPEG,
        compress: OUTPUT_JPEG_QUALITY,
      });
      return result.uri;
    } finally {
      cropped.release();
    }
  } finally {
    image.release();
  }
}
