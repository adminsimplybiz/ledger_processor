const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const outPath = path.join(__dirname, '..', 'src', 'features', 'payslip-generator', 'payslipLogos.ts');

const files = [
  { name: 'sunstripe', file: 'sunstripe logo.jpg', mime: 'image/jpeg' },
  { name: 'valuestream', file: 'valuestream logo.png', mime: 'image/png' },
  { name: 'vira', file: 'Vira insight logo.png', mime: 'image/png' },
];

let out = '// Auto-generated: Base64-embedded logos for payslip PDF (no broken images)\n\nexport const PAYSLIP_LOGOS = {\n';

files.forEach((f) => {
  const p = path.join(publicDir, f.file);
  if (fs.existsSync(p)) {
    const b64 = fs.readFileSync(p).toString('base64');
    out += `  ${f.name}: 'data:${f.mime};base64,${b64}',\n`;
  }
});

out += '} as const;\n';
fs.writeFileSync(outPath, out);
console.log('payslipLogos.ts written with', files.length, 'logos');
