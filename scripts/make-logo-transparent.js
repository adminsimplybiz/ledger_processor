/**
 * Makes white/near-white pixels in the Finance Workbench logo transparent
 * so the logo has no visible white box on the page.
 * Run: node scripts/make-logo-transparent.js
 */
const path = require('path');
const fs = require('fs');

async function main() {
  let Jimp;
  try {
    Jimp = require('jimp');
  } catch (e) {
    console.error('Run: npm install --save-dev jimp');
    process.exit(1);
  }

  const publicDir = path.join(__dirname, '..', 'public');
  const inputPath = path.join(publicDir, 'finance-workbench-logo.png');
  const outputPath = path.join(publicDir, 'finance-workbench-logo.png');
  const backupPath = path.join(publicDir, 'finance-workbench-logo-original.png');

  if (!fs.existsSync(inputPath)) {
    console.error('Logo not found:', inputPath);
    process.exit(1);
  }

  const image = await Jimp.read(inputPath);

  // Back up original if we haven't already
  if (!fs.existsSync(backupPath)) {
    await image.clone().write(backupPath);
    console.log('Backed up original to finance-workbench-logo-original.png');
  }

  // Make white and near-white pixels transparent (threshold: 248 so we don't cut into edges)
  const threshold = 248;
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      this.bitmap.data[idx + 3] = 0;
    }
  });

  await image.write(outputPath);
  console.log('Written transparent logo to finance-workbench-logo.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
