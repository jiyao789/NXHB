const fs = require('fs');
const path = require('path');
const https = require('https');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!filepath.includes('node_modules') && !filepath.includes('.git') && !filepath.includes('styles')) {
        walk(filepath, filelist);
      }
    } else if (filepath.endsWith('.wxml')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const wxmlFiles = walk(__dirname);
let allContent = '';
wxmlFiles.forEach(file => {
  allContent += fs.readFileSync(file, 'utf-8') + '\n';
});

const regex = /i-carbon-([a-zA-Z0-9-]+)/g;
let match;
const iconsSet = new Set();
while ((match = regex.exec(allContent)) !== null) {
  iconsSet.add(match[1]);
}
// Add explicit safe list found in original config
['home', 'map', 'qr-code', 'fire', 'user'].forEach(i => iconsSet.add(i));

const iconsList = Array.from(iconsSet);
console.log(`Found ${iconsList.length} unique icons:`, iconsList.join(', '));

if(iconsList.length === 0) {
  process.exit(0);
}

const apiUrl = `https://api.iconify.design/carbon.json?icons=${iconsList.join(',')}`;

https.get(apiUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    let css = `
/* Global Carbon Icons Auto-Generated */
[class^="i-carbon-"], [class*=" i-carbon-"] {
  display: inline-block;
  vertical-align: middle;
  width: 1em;
  height: 1em;
  background-color: currentColor;
}
`;
    // For currentColor masking in modern browsers, we use -webkit-mask
    
    iconsList.forEach(name => {
      const iconData = json.icons[name];
      if (!iconData) {
         console.warn("Icon not found:", name);
         return;
      }
      const width = iconData.width || json.width || 32;
      const height = iconData.height || json.height || 32;
      const body = iconData.body;
      
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>`;
      const encodedSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
          .replace(/'/g, '%27')
          .replace(/"/g, '%22');

      css += `
.i-carbon-${name} {
  -webkit-mask: url("${encodedSvg}") no-repeat 50% 50%;
  mask: url("${encodedSvg}") no-repeat 50% 50%;
  -webkit-mask-size: cover;
  mask-size: cover;
}
`;
    });
    
    // Add specific utility classes
    css += `
.text-xs { font-size: 24rpx; }
.text-sm { font-size: 28rpx; }
.text-base { font-size: 32rpx; }
.text-lg { font-size: 36rpx; }
.text-xl { font-size: 40rpx; }
.text-2xl { font-size: 48rpx; }
.text-3xl { font-size: 60rpx; }
.text-4xl { font-size: 72rpx; }
.text-5xl { font-size: 96rpx; }
.text-6xl { font-size: 120rpx; }
.text-10 { font-size: 20rpx; }

.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

    const outDir = path.join(__dirname, 'styles');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});
    fs.writeFileSync(path.join(outDir, 'icons.scss'), css, 'utf-8');
    console.log('Successfully wrote styles/icons.scss');
  });
}).on('error', err => {
  console.error('Failed to fetch from Iconify API:', err);
});
