export type BackgroundPhotoViewMode = "zoom" | "repeat";

export const BACKGROUND_PHOTO_MARGIN_BLUR = 16;

const EDGE_FRACTION = 0.1;

export function getBackgroundPhotoZoomFrame(
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
) {
  if (width <= 0 || height <= 0 || imageWidth <= 0 || imageHeight <= 0) return null;

  if (width > height && imageWidth < imageHeight) {
    const x = width * EDGE_FRACTION;
    return { x, y: 0, width: width - 2 * x, height };
  }
  if (height > width && imageWidth > imageHeight) {
    const y = height * EDGE_FRACTION;
    return { x: 0, y, width, height: height - 2 * y };
  }
  return null;
}
