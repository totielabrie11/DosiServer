const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Ruta del archivo JSON que almacena los datos del equipo
const equipoPath = path.join(__dirname, '../data/equipo.json');

// **Configuración de Multer para la subida de imágenes**
const storageEquipo = multer.diskStorage({
  destination: (req, file, cb) => {
    // Guardar imágenes en la carpeta 'uploads/fotos' en la raíz del proyecto
    cb(null, path.join(__dirname, '../uploads/fotos'));
  },
  filename: (req, file, cb) => {
    // Utilizamos el nombre del archivo original
    cb(null, file.originalname);
  }
});

// Inicializamos multer con la configuración de almacenamiento
const uploadEquipo = multer({
  storage: storageEquipo,
  fileFilter: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/fotos', file.originalname);
    if (fs.existsSync(uploadPath)) {
      // Si el archivo ya existe, devolvemos un mensaje al frontend
      return cb(null, false); // Cancela la subida
    }
    cb(null, true); // Permite la subida si el archivo no existe
  }
}).single('image'); // Limitamos la subida a un archivo con el campo "image"

// Función para leer el archivo JSON del equipo
function readFileFromPath(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Función para guardar datos en el archivo JSON
function saveFileToPath(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Controlador para obtener los miembros del equipo
const getEquipo = (req, res) => {
  try {
    const equipo = readFileFromPath(equipoPath);
    res.json(equipo);
  } catch (error) {
    console.error('Error al obtener los datos del equipo:', error);
    res.status(500).json({ message: 'Error al obtener los datos del equipo', error });
  }
};

// Controlador para crear o editar un miembro del equipo
const createOrUpdateMiembro = (req, res) => {
  uploadEquipo(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Error de multer
      return res.status(500).json({ message: 'Error subiendo el archivo', error: err.message });
    } else if (err) {
      // Error general
      return res.status(500).json({ message: 'Error procesando el miembro del equipo', error: err.message });
    }

    // Si no hay archivo porque ya existe, devolver un mensaje
    if (!req.file) {
      return res.status(409).json({
        message: 'El archivo ya existe. ¿Desea sobrescribirlo?',
        action: 'overwrite'
      });
    }

    // Si el archivo fue subido, continuamos con la lógica de creación/actualización
    try {
      const { id, nombre, rol, email, telefono, linkedin } = req.body;
      const image = `/uploads/fotos/${req.file.originalname}`; // Usamos el nombre original del archivo

      let equipo = readFileFromPath(equipoPath);

      if (id) {
        // Editar miembro existente
        const miembroIndex = equipo.findIndex(m => m.id === parseInt(id));
        if (miembroIndex !== -1) {
          equipo[miembroIndex] = {
            ...equipo[miembroIndex],
            nombre,
            rol,
            email,
            telefono,
            linkedin,
            image: image || equipo[miembroIndex].image
          };
        } else {
          return res.status(404).json({ message: 'Miembro no encontrado' });
        }
      } else {
        // Crear nuevo miembro
        const newId = equipo.length ? equipo[equipo.length - 1].id + 1 : 1;
        const newMiembro = {
          id: newId,
          nombre,
          rol,
          email,
          telefono,
          linkedin,
          image: image || ''
        };
        equipo.push(newMiembro);
      }

      saveFileToPath(equipoPath, equipo);
      res.json({ message: 'Miembro actualizado correctamente', equipo });
    } catch (error) {
      console.error('Error procesando el miembro del equipo:', error);
      res.status(500).json({ message: 'Error procesando el miembro del equipo', error });
    }
  });
};

// Controlador para sobrescribir una imagen existente
const overwriteImage = (req, res) => {
  const { filename } = req.params;

  const overwriteUpload = multer({
    storage: storageEquipo,
  }).single('image');

  overwriteUpload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error al sobrescribir la imagen', error: err.message });
    }

    // Sobrescribir imagen sin más validaciones
    res.json({ message: 'Imagen sobrescrita con éxito', url: `/uploads/fotos/${filename}` });
  });
};

// Controlador para eliminar un miembro del equipo
const deleteMiembro = (req, res) => {
  try {
    const { id } = req.params;
    let equipo = readFileFromPath(equipoPath);

    const miembroToDelete = equipo.find(miembro => miembro.id === parseInt(id));

    if (miembroToDelete) {
      // Eliminar miembro del equipo
      equipo = equipo.filter(miembro => miembro.id !== parseInt(id));
      saveFileToPath(equipoPath, equipo);

      // Eliminar imagen si existe
      if (miembroToDelete.image) {
        const imagePath = path.join(__dirname, '..', miembroToDelete.image);
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error('Error al eliminar la imagen:', err);
            }
          });
        }
      }

      res.json(equipo);
    } else {
      res.status(404).json({ message: 'Miembro no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar el miembro del equipo:', error);
    res.status(500).json({ message: 'Error al eliminar el miembro del equipo', error });
  }
};

// Exportar controladores y multer para su uso en el router o en server.js
module.exports = {
  getEquipo,
  createOrUpdateMiembro,
  deleteMiembro,
  uploadEquipo,  // Exportar multer para ser usado en las rutas
  overwriteImage  // Controlador para sobrescribir la imagen
};
