import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGenerator } from '@unocss/core';
import presetIcons from '@unocss/preset-icons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!filepath.includes('node_modules') && !filepath.includes('.git')) {
        await walk(filepath, filelist);
      }
    } else if (filepath.endsWith('.wxml')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

async function build() {
  const miniprogramDir = __dirname;
  const wxmlFiles = await walk(miniprogramDir);
  
  let code = '';
  for (const file of wxmlFiles) {
    code += fs.readFileSync(file, 'utf-8') + '\n';
  }

  const uno = createGenerator({
    presets: [
      presetIcons({
        scale: 1.2,
        warn: true,
        extraProperties: {
          'display': 'inline-block',
          'vertical-align': 'middle',
        },
      })
    ]
  });

  const { css } = await uno.generate(code);
  
  const cssPath = path.join(miniprogramDir, 'styles', 'icons.scss');
  fs.writeFileSync(cssPath, css, 'utf-8');
  console.log(`Successfully extracted icons to ${cssPath}`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
