const fs = require('node:fs');
const path = require('node:path');

module.exports = function patchAndroidHeicPicker() {
  const root = path.resolve(__dirname, '../node_modules/expo-image-picker');
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (version !== '58.0.10') throw new Error('Review the Android HEIC picker patch before changing expo-image-picker');
  const file = path.join(root, 'android/src/main/java/expo/modules/imagepicker/exporters/CompressionImageExporter.kt');
  const original = fs.readFileSync(file, 'utf8');
  let source = original.replace(/\r\n/g, '\n');

  const imports = 'import android.graphics.ImageDecoder\nimport android.os.Build\n';
  const bitmap = '    val bitmap = readBitmap(source)';
  const decoder = [
    '    // The picker can return a content URI whose HEIF data Glide cannot decode.',
    '    val mimeType = contentResolver.getType(source)',
    '    val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&',
    '      (mimeType == "image/heic" || mimeType == "image/heif")) {',
    '      ImageDecoder.decodeBitmap(ImageDecoder.createSource(contentResolver, source)) { decoder, _, _ ->',
    '        decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE',
    '      }',
    '    } else {',
    '      readBitmap(source)',
    '    }',
  ].join('\n');

  if (source.includes(imports) && source.includes(decoder)) return;
  const anchor = 'import android.graphics.Bitmap\n';
  if (source.includes(imports) || source.split(anchor).length !== 2 || source.split(bitmap).length !== 2) {
    throw new Error('Android HEIC picker patch no longer matches the installed exporter');
  }
  source = source.replace(anchor, anchor + imports).replace(bitmap, decoder);
  fs.writeFileSync(file, original.includes('\r\n') ? source.replace(/\n/g, '\r\n') : source);
};
