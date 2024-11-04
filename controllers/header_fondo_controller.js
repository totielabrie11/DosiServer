const path = require('path');
const fs = require('fs');
const multer = require('multer');
const express = require('express');
const router = express.Router();

// Directorio donde se almacenan los encabezados
const headersDir = path.join(__dirname, '..', 'uploads', 'fotos', 'headers');

// Verificar si el directorio 'uploads/fotos/headers' existe. Si no existe, crearlo.
if (!fs.existsSync(headersDir)) {
  fs.mkdirSync(headersDir, { recursive: true }); // Crea el directorio de forma recursiva si no existe
}

// Configuración de multer para subir encabezados a 'uploads/fotos/headers'
const storageHeaders = multer.diskStorage({
  destination: (req, file, cb) => {
    // Asegurarse de que el directorio de destino exista
    if (!fs.existsSync(headersDir)) {
      fs.mkdirSync(headersDir, { recursive: true });
    }
    cb(null, headersDir); // Establecer el directorio como destino
  },
  filename: (req, file, cb) => {
    const userFilename = req.body.name ? req.body.name : Date.now().toString(); // Usar el nombre proporcionado o timestamp
    cb(null, userFilename + path.extname(file.originalname)); // Guardar archivo con el nombre proporcionado
  }
});

const uploadHeaders = multer({ storage: storageHeaders });

// Endpoint para obtener la lista de encabezados
router.get('/api/encabezados', (req, res) => {
  fs.readdir(headersDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al leer el directorio de encabezados' });
    }
    const headers = files.map(file => ({
      name: file,
      url: `/uploads/fotos/headers/${file}`
    }));
    res.json({ success: true, headers });
  });
});

// Endpoint para subir un nuevo encabezado
router.post('/api/encabezados/upload', uploadHeaders.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se ha subido ninguna imagen' });
  }
  res.json({ success: true, message: 'Encabezado subido con éxito', url: `/uploads/fotos/headers/${req.file.filename}` });
});

// Endpoint para eliminar un encabezado
router.delete('/api/encabezados/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(headersDir, filename);

  fs.unlink(filePath, (err) => {
    if (err && err.code === 'ENOENT') {
      return res.status(404).json({ success: false, message: 'Encabezado no encontrado' });
    } else if (err) {
      return res.status(500).json({ success: false, message: 'Error al eliminar el encabezado', error: err });
    }

    res.json({ success: true, message: 'Encabezado eliminado con éxito' });
  });
});

// Endpoint para modificar un encabezado
router.put('/api/encabezados/:filename', uploadHeaders.single('image'), (req, res) => {
  const currentFilename = req.params.filename;  // Nombre del encabezado que se va a modificar
  const newFilename = req.body.name;  // Nuevo nombre del encabezado

  // Extraer la extensión del archivo original
  const originalExtension = path.extname(currentFilename);  // Obtiene la extensión original (e.g., ".jpg")

  // Validar que se proporcione un nuevo nombre
  if (!newFilename) {
    return res.status(400).json({ success: false, message: 'Debes proporcionar un nuevo nombre.' });
  }

  // Ruta actual del archivo
  const currentFilePath = path.join(headersDir, currentFilename);

  // Construir la nueva ruta con el nuevo nombre y la misma extensión
  const newFilePath = path.join(headersDir, newFilename + originalExtension);

  // Si se subió un nuevo archivo, primero eliminamos el archivo anterior y guardamos el nuevo
  if (req.file) {
    fs.unlink(currentFilePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        return res.status(500).json({ success: false, message: 'Error al eliminar el encabezado existente.', error: err });
      }

      // Guardar el nuevo archivo con el nuevo nombre (usando la extensión del archivo subido)
      fs.rename(req.file.path, newFilePath, (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error al guardar el nuevo archivo.', error: err });
        }

        res.json({ success: true, message: 'Encabezado y archivo modificados con éxito.', url: `/uploads/fotos/headers/${newFilename}${originalExtension}` });
      });
    });
  } else {
    // Si no hay un nuevo archivo, solo renombramos el archivo existente, conservando la extensión original
    fs.rename(currentFilePath, newFilePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).json({ success: false, message: 'Encabezado no encontrado.' });
        }
        return res.status(500).json({ success: false, message: 'Error al renombrar el encabezado.', error: err });
      }

      res.json({ success: true, message: 'Encabezado renombrado con éxito.', url: `/uploads/fotos/headers/${newFilename}${originalExtension}` });
    });
  }
});

module.exports = router;
