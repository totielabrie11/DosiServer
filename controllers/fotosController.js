// controllers/fotosController.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuración de multer para subir imágenes
const storageImages = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'images'));
  },
  filename: (req, file, cb) => {
    const userFilename = req.body.name ? req.body.name : Date.now().toString();
    cb(null, userFilename + path.extname(file.originalname));
  }
});

const uploadImages = multer({ storage: storageImages });

const imagesDir = path.join(__dirname, '..', 'public', 'images');

// Obtener todas las imágenes
const getAllImages = (req, res) => {
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al leer el directorio' });
    }

    const images = files.filter(file => fs.lstatSync(path.join(imagesDir, file)).isFile()).map(file => ({
      name: file,
      url: `/images/${file}`
    }));

    res.json({ success: true, images });
  });
};

// Subir una nueva imagen
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se ha subido ninguna imagen' });
  }
  res.json({ success: true, message: 'Imagen subida con éxito', url: `/images/${req.file.filename}` });
};

// Eliminar una imagen
const deleteImage = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(imagesDir, filename);

  fs.unlink(filePath, (err) => {
    if (err && err.code === 'ENOENT') {
      return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    } else if (err) {
      return res.status(500).json({ success: false, message: 'Error al eliminar la imagen', error: err });
    }

    res.json({ success: true, message: 'Imagen eliminada con éxito' });
  });
};

// Reemplazar una imagen existente
const replaceImage = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(imagesDir, filename);

  fs.unlink(filePath, (err) => {
    if (err && err.code === 'ENOENT') {
      console.log('Archivo no encontrado, subiendo la nueva imagen');
    } else if (err) {
      return res.status(500).json({ success: false, message: 'Error al eliminar la imagen existente', error: err });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ninguna nueva imagen para reemplazar' });
    }

    res.json({ success: true, message: 'Imagen reemplazada con éxito', url: `/images/${req.file.filename}` });
  });
};

module.exports = {
  uploadImages,
  getAllImages,
  uploadImage,
  deleteImage,
  replaceImage
};