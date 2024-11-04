const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Ruta a la carpeta de destino
const uploadDir = path.join(__dirname, '..', 'uploads', 'fotos', 'fondos');

// Función para crear directorios si no existen
const ensureDirectoryExistence = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true }); // Crea los directorios de forma recursiva
  }
};

// Asegúrate de que la carpeta `uploads/fotos/fondos` exista
ensureDirectoryExistence(uploadDir);

// Configuración de multer para subir imágenes
const storageImages = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Guardar en `uploads/fotos/fondos`
  },
  filename: (req, file, cb) => {
    const userFilename = req.body.name ? req.body.name : Date.now().toString();
    cb(null, userFilename + path.extname(file.originalname)); // Guardar con la extensión original
  }
});

const uploadImages = multer({ storage: storageImages });

// Obtener todas las imágenes en `uploads/fotos/fondos`
const getAllImages = (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al leer el directorio' });
    }

    const images = files
      .filter(file => fs.lstatSync(path.join(uploadDir, file)).isFile()) // Filtrar solo archivos
      .map(file => ({
        name: file,
        url: `/uploads/fotos/fondos/${file}` // Asegurarse de devolver la URL correcta
      }));

    res.json({ success: true, images });
  });
};

// Subir una nueva imagen a `uploads/fotos/fondos`
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se ha subido ninguna imagen' });
  }
  res.json({ success: true, message: 'Imagen subida con éxito', url: `/uploads/fotos/fondos/${req.file.filename}` });
};

// Eliminar una imagen de `uploads/fotos/fondos`
const deleteImage = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  fs.unlink(filePath, (err) => {
    if (err && err.code === 'ENOENT') {
      return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    } else if (err) {
      return res.status(500).json({ success: false, message: 'Error al eliminar la imagen', error: err });
    }

    res.json({ success: true, message: 'Imagen eliminada con éxito' });
  });
};

// Reemplazar una imagen existente en `uploads/fotos/fondos`
const replaceImage = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  fs.unlink(filePath, (err) => {
    if (err && err.code === 'ENOENT') {
      console.log('Archivo no encontrado, subiendo la nueva imagen');
    } else if (err) {
      return res.status(500).json({ success: false, message: 'Error al eliminar la imagen existente', error: err });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ninguna nueva imagen para reemplazar' });
    }

    res.json({ success: true, message: 'Imagen reemplazada con éxito', url: `/uploads/fotos/fondos/${req.file.filename}` });
  });
};

// Exportar los controladores
module.exports = {
  uploadImages,
  getAllImages,
  uploadImage,
  deleteImage,
  replaceImage
};
