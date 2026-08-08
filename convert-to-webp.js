/**
 * Image to WebP Converter Utility Functions
 * Supports both Node.js (via 'sharp' module) and Browser (via HTMLCanvasElement)
 */

// ==========================================
// 1. NODE.JS CONVERSION FUNCTION
// ==========================================
/**
 * Converts all images in a folder to WebP format using Node.js & Sharp.
 * 
 * @param {string} inputDir - Directory containing source images (e.g. './assets')
 * @param {string} outputDir - Destination directory (defaults to inputDir)
 * @param {number} quality - Compression quality 1-100 (Default: 85 - visually lossless)
 * 
 * Usage requirement: `npm install sharp`
 */
async function convertFolderToWebPNode(inputDir = './assets', outputDir = null, quality = 85) {
  const fs = require('fs');
  const path = require('path');
  
  let sharp;
  try {
    sharp = require('sharp');
  } catch (err) {
    console.error("❌ 'sharp' library is required for Node.js image conversion.");
    console.log("👉 Run: npm install sharp");
    return;
  }

  const destDir = outputDir || inputDir;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter(f => /\.(png|jpe?g|tiff|bmp)$/i.test(f));

  console.log(`🚀 Found ${imageFiles.length} images to convert...`);

  let totalOriginal = 0;
  let totalWebP = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const fileNameWithoutExt = path.basename(file, path.extname(file));
    const outputPath = path.join(destDir, `${fileNameWithoutExt}.webp`);

    const origStats = fs.statSync(inputPath);
    totalOriginal += origStats.size;

    await sharp(inputPath)
      .webp({ quality: quality, effort: 6 }) // quality 85 provides peak size reduction with zero visual loss
      .toFile(outputPath);

    const webpStats = fs.statSync(outputPath);
    totalWebP += webpStats.size;

    const savedPercent = ((1 - webpStats.size / origStats.size) * 100).toFixed(1);
    console.log(`✅ Converted ${file} -> ${fileNameWithoutExt}.webp [${(origStats.size / 1024).toFixed(1)}KB → ${(webpStats.size / 1024).toFixed(1)}KB, -${savedPercent}%]`);
  }

  console.log('\n==========================================');
  console.log(`🎉 Finished! Total size reduced from ${(totalOriginal / (1024 * 1024)).toFixed(2)}MB to ${(totalWebP / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`📉 Total Space Saved: ${((1 - totalWebP / totalOriginal) * 100).toFixed(1)}%`);
  console.log('==========================================\n');
}

// ==========================================
// 2. BROWSER CANVAS CONVERSION FUNCTION
// ==========================================
/**
 * Converts an Image File or URL to a WebP Blob/DataURL in the browser.
 * 
 * @param {HTMLImageElement|File|string} imageInput - HTML Image element, File object, or Image URL
 * @param {number} quality - Quality between 0.0 and 1.0 (Default: 0.85)
 * @returns {Promise<{blob: Blob, dataUrl: string, width: number, height: number, newSize: number}>}
 */
async function convertImageToWebPBrowser(imageInput, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      // Create canvas with original dimensions
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Export as WebP Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('WebP conversion failed in canvas.'));
            return;
          }
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve({
            blob: blob,
            dataUrl: dataUrl,
            width: canvas.width,
            height: canvas.height,
            newSize: blob.size
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => reject(err);

    if (imageInput instanceof File) {
      img.src = URL.createObjectURL(imageInput);
    } else if (typeof imageInput === 'string') {
      img.src = imageInput;
    } else if (imageInput instanceof HTMLImageElement) {
      img.src = imageInput.src;
    }
  });
}

// Export for CommonJS / ESM / Browser Window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { convertFolderToWebPNode, convertImageToWebPBrowser };
}
if (typeof window !== 'undefined') {
  window.convertImageToWebPBrowser = convertImageToWebPBrowser;
}
