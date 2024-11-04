const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
const novedadesPath = path.join(__dirname, '../data/novedades.json'); // Ruta al archivo novedades.json

// Configuración de Multer para subir imágenes a la carpeta 'uploads/fotos/novedades'
const storageNovedades = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/fotos/novedades');
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre único con la extensión original
  }
});

const uploadNovedades = multer({ storage: storageNovedades });

// Función para leer el archivo novedades.json
const readFileFromPath = (filePath) => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
};

// Función para guardar datos en novedades.json
const saveFileToPath = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Endpoint para obtener todas las novedades
router.get('/api/novedades', (req, res) => {
  try {
    const novedades = readFileFromPath(novedadesPath);
    res.json(novedades);
  } catch (err) {
    res.status(500).json({ message: 'Error leyendo novedades.json', error: err });
  }
});

// Endpoint para crear o editar novedades
router.post('/api/novedades', uploadNovedades.single('image'), (req, res) => {
  try {
    const { id, text, span } = req.body;
    const image = req.file ? `/uploads/fotos/novedades/${req.file.filename}` : null;

    let novedades = readFileFromPath(novedadesPath);

    if (id) {
      // Editar novedad existente
      const novedadIndex = novedades.findIndex(n => n.id === parseInt(id));
      if (novedadIndex !== -1) {
        novedades[novedadIndex].text = text;
        novedades[novedadIndex].span = span;
        if (image) {
          novedades[novedadIndex].image = image;
        }
      } else {
        return res.status(404).json({ message: 'Novedad no encontrada' });
      }
    } else {
      // Crear nueva novedad
      const newId = novedades.length ? novedades[novedades.length - 1].id + 1 : 1;
      const newNovedad = {
        id: newId,
        image: image || '',
        text,
        span
      };
      novedades.push(newNovedad);
    }

    saveFileToPath(novedadesPath, novedades);
    res.json(novedades);
  } catch (error) {
    res.status(500).json({ message: 'Error procesando la novedad', error });
  }
});

// Endpoint para eliminar una novedad
router.delete('/api/novedades/:id', (req, res) => {
  const { id } = req.params;
  let novedades = readFileFromPath(novedadesPath);

  const novedadToDelete = novedades.find(novedad => novedad.id === parseInt(id));

  if (novedadToDelete) {
    // Eliminar la novedad
    novedades = novedades.filter(novedad => novedad.id !== parseInt(id));
    saveFileToPath(novedadesPath, novedades);

    // Eliminar archivo de imagen si existe
    if (novedadToDelete.image) {
      const imagePath = path.join(__dirname, '../public', novedadToDelete.image);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error('Error al eliminar la imagen:', err);
          }
        });
      }
    }

    return res.json({ success: true });
  } else {
    return res.status(404).json({ message: 'Novedad no encontrada' });
  }
});

module.exports = router;
