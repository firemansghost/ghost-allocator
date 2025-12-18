/**
 * Generate OG image for Ghost Allocator
 * Creates a 1200x630 PNG with branding
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const width = 1200;
const height = 630;
const outputPath = path.join(__dirname, '..', 'public', 'og', 'default.png');

// Create SVG with text
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#18181b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <text x="600" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="600" fill="#fbbf24" text-anchor="middle">Ghost Allocator</text>
  <text x="600" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="400" fill="#a1a1aa" text-anchor="middle">OKC 457 Allocation Tool</text>
</svg>
`;

async function generateImage() {
  try {
    // Convert SVG to PNG
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log('✅ Created OG image at:', outputPath);
    console.log(`   Size: ${width}x${height}px`);
  } catch (error) {
    console.error('Error generating image:', error);
    process.exit(1);
  }
}

generateImage();
