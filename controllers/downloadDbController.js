const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

exports.downloadDB = (req, res) => {
  // Comentar o eliminar la verificación de administrador temporalmente
  // if (!req.session.isAdmin) {
  //   return res.status(403).json({ message: 'Acceso denegado' });
  // }

  const dataDir = path.join(__dirname, '../data');   // Directorio con archivos JSON
  const tempDir = path.join(__dirname, '../temp');   // Directorio temporal para almacenar el ZIP
  const uploadsDir = path.join(__dirname, '../uploads');  // Directorio de uploads que queremos añadir

  // Verifica si la carpeta /temp existe, si no, la crea.
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const outputPath = path.join(tempDir, 'db_backup.zip');

  // Crear un stream para escribir el archivo ZIP
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  // Manejar errores
  output.on('close', () => {
    res.download(outputPath, 'db_backup.zip', (err) => {
      if (err) {
        console.error('Error al descargar el archivo', err);
      }
      fs.unlinkSync(outputPath); // Eliminar el archivo ZIP después de la descarga
    });
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // Añadir todos los archivos JSON del directorio 'data' al ZIP
  fs.readdirSync(dataDir).forEach(file => {
    const filePath = path.join(dataDir, file);
    if (path.extname(file) === '.json') {
      archive.file(filePath, { name: path.join('data', file) });  // Guardar en la carpeta 'data' dentro del ZIP
    }
  });

  // Añadir la carpeta 'uploads' al archivo ZIP, incluyendo todos sus archivos y subdirectorios
  archive.directory(uploadsDir, 'uploads');  // Añadir la carpeta 'uploads' al ZIP

  // Finalizar el archivo ZIP
  archive.finalize();
};
