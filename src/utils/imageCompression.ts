/**
 * Utility to compress images uploaded from mobile or desktop
 * Scales high-resolution photos (e.g. 4000px 8MB from iPhone) down to max 1200px
 * and compresses to lightweight JPEG (~80KB - 140KB).
 */
export async function compressImageFile(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.75
): Promise<string> {
  // If not an image or is SVG, return standard data URL
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to uncompressed dataUrl on error
        resolve(dataUrl);
      };
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if larger than max dimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Enable high quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Output compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
