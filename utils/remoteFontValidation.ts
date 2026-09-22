const MIN_FONT_FILE_BYTES = 1024;

function hasSupportedFontSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  const signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  return (
    (bytes[0] === 0x00 &&
      bytes[1] === 0x01 &&
      bytes[2] === 0x00 &&
      bytes[3] === 0x00) ||
    signature === "OTTO" ||
    signature === "ttcf" ||
    signature === "true"
  );
}

export function isPlausibleFontFile(
  size: number,
  signature: Uint8Array,
): boolean {
  return size >= MIN_FONT_FILE_BYTES && hasSupportedFontSignature(signature);
}
