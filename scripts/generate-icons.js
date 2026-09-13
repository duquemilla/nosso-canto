import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = fs.readFileSync('public/app-icon.svg', 'utf8');

// For apple-touch-icon, ensure square fill so iOS masks it smoothly without corners clipping
const fullBleedSvg = svgContent.replace('rx="115"', 'rx="0"');

async function generate() {
  const publicDir = path.resolve('public');

  // 180x180 apple-touch-icon (standard for iOS home screen bookmarks)
  await sharp(Buffer.from(fullBleedSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 192x192 PWA icon
  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 512x512 PWA icon
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // favicon.png (64x64)
  await sharp(Buffer.from(svgContent))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('App icons generated successfully!');
}

generate().catch(console.error);
