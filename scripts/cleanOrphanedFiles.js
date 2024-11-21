const fs = require('fs/promises');
const path = require('path');

// Configuración
const modelsDir = path.join(__dirname, '../public/models'); // Carpeta de modelos
const jsonDBPaths = [
  path.join(__dirname, '../data/productosDescription.json'),
  path.join(__dirname, '../data/productOrder.json'),
];

// Función para cargar todos los registros de los archivos JSON
async function loadJSONRecords() {
  let allRecords = [];

  for (const jsonPath of jsonDBPaths) {
    try {
      const data = await fs.readFile(jsonPath, 'utf-8');
      const records = JSON.parse(data);

      // Filtrar solo registros válidos con `path-image`
      const validRecords = records
        .filter((record) => record['path-image'] && typeof record['path-image'] === 'string') // Validar `path-image`
        .map((record) => path.basename(record['path-image'])); // Obtener solo el nombre del archivo

      allRecords = allRecords.concat(validRecords);
    } catch (error) {
      console.error(`Error al leer el archivo JSON ${jsonPath}:`, error.message);
    }
  }

  return allRecords;
}

// Función para limpiar archivos huérfanos
async function cleanOrphanedFiles() {
  try {
    console.log('Iniciando limpieza de archivos huérfanos...');

    // Cargar registros válidos desde JSON
    const validFileNames = new Set(await loadJSONRecords());
    console.log('Archivos válidos según los registros JSON:', validFileNames);

    // Leer todos los archivos en la carpeta de modelos
    const filesInDirectory = await fs.readdir(modelsDir);

    for (const file of filesInDirectory) {
      if (!validFileNames.has(file)) {
        const filePath = path.join(modelsDir, file);
        try {
          await fs.unlink(filePath); // Eliminar el archivo huérfano
          console.log(`Archivo eliminado: ${file}`);
        } catch (error) {
          console.error(`Error al eliminar el archivo ${file}:`, error.message);
        }
      }
    }

    console.log('Limpieza completada.');
  } catch (error) {
    console.error('Error durante la limpieza de archivos huérfanos:', error.message);
  }
}

// Exportar la función para ser utilizada en el servidor
module.exports = cleanOrphanedFiles;
