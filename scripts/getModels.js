const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'public', 'models');

function getGLTFFiles() {
  let models = [];
  let gltfCount = 0;
  let glbCount = 0;
  let jpgCount = 0;
  let pngCount = 0;

  const items = fs.readdirSync(modelsDir);
  const uniqueProducts = new Map();

  items.forEach(item => {
    const fileExtension = path.extname(item).toLowerCase();
    const modelName = path.basename(item, fileExtension);
    const modelPath = `/models/${item}`;

    if (['.gltf', '.glb', '.jpg', '.png'].includes(fileExtension)) {
      if (!uniqueProducts.has(modelName) || ['.jpg', '.png'].includes(fileExtension)) {
        uniqueProducts.set(modelName, { name: modelName, path: modelPath });
      }

      if (fileExtension === '.gltf') {
        gltfCount++;
      } else if (fileExtension === '.glb') {
        glbCount++;
      } else if (fileExtension === '.jpg') {
        jpgCount++;
      } else if (fileExtension === '.png') {
        pngCount++;
      }
    }
  });

  models = Array.from(uniqueProducts.values());

  console.log(`Total GLTF models found: ${gltfCount}`);
  console.log(`Total GLB models found: ${glbCount}`);
  console.log(`Total JPG images found: ${jpgCount}`);
  console.log(`Total PNG images found: ${pngCount}`);

  return { models, gltfCount, glbCount, jpgCount, pngCount };
}

module.exports = getGLTFFiles;
