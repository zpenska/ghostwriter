const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = './bulk-import';
const OUTPUT_DIR = './converted-html';
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const result = {
  templates: {},
  'template-collections': {}
};

const collectionsCreated = new Set();
let templateIndex = 1;
let collectionIndex = 1;

const folders = fs.readdirSync(ROOT_DIR).filter(f => fs.statSync(path.join(ROOT_DIR, f)).isDirectory());

for (const folder of folders) {
  const folderPath = path.join(ROOT_DIR, folder);
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.docx'));

  // Create collection doc
  const collectionId = `collection-${collectionIndex++}`;
  if (!collectionsCreated.has(folder)) {
    result['template-collections'][collectionId] = {
      name: folder,
      createdAt: new Date().toISOString()
    };
    collectionsCreated.add(folder);
  }

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const baseName = path.basename(file, '.docx');

    // Convert to HTML
    console.log(`🌀 Converting: ${file}`);
    execSync(`libreoffice --headless --convert-to html "${filePath}" --outdir "${OUTPUT_DIR}"`);
    const htmlFilePath = path.join(OUTPUT_DIR, baseName + '.html');
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // Build template doc
    const docId = `template-${templateIndex++}`;
    const tags = baseName.split(' ').filter(word => word.length > 3);
    const type = baseName.toLowerCase().includes('denial') ? 'Denial'
                : baseName.toLowerCase().includes('approval') ? 'Approval'
                : 'General';

    result.templates[docId] = {
      name: baseName,
      html: htmlContent,
      collectionId,
      tags,
      documentType: type,
      originalFileName: file,
      createdAt: new Date().toISOString()
    };
  }
}

// Write output
fs.writeFileSync('firefoo-export.json', JSON.stringify(result, null, 2));
console.log('✅ Export complete: firefoo-export.json');
