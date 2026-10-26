/**
 * Mobile-friendly client-side image optimizer.
 * Downscales massive smartphone screenshots (e.g. 1440x3200 or 1290x2796)
 * to crisp ~1800px max dimensions and compresses to JPEG ~0.85.
 *
 * This reduces upload size from 5-10MB down to ~250-400KB:
 * - Prevents hitting Vercel's 4.5MB Serverless Function payload limit
 * - Prevents hitting Inngest's 512KB event size limit
 * - Solves mobile timeout / connection reset errors
 * - Converts HEIC/PNG on iOS/Android into web-standard JPEG
 */

export async function optimizeScreenshot(
  file: File,
  maxDimension = 1800,
  quality = 0.85
): Promise<File> {
  // If not in a browser environment, return file unchanged
  if (typeof window === "undefined") {
    return file;
  }

  // Verify it is an image or has an image extension
  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|heic|heif|bmp)$/i.test(file.name);

  if (!isImage) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Downscale if either dimension exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      } else if (file.size < 600 * 1024 && (file.type === "image/jpeg" || file.type === "image/webp")) {
        // Already small JPEG/WebP, keep as is
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw white background for transparent screenshots
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const optimizedFile = new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback: resolve with original file if canvas load fails
      resolve(file);
    };

    img.src = objectUrl;
  });
}
