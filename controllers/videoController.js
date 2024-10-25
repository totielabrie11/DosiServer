const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Rutas a los archivos de base de datos
const videosPath = path.join(__dirname, '../data/videos.json');
const pagesVideosPath = path.join(__dirname, '../data/pagesVideos.json');  // Archivo de asignación de videos a páginas

// Función para leer videos desde el archivo JSON
const readVideosFromFile = () => {
  if (fs.existsSync(videosPath)) {
    return JSON.parse(fs.readFileSync(videosPath, 'utf8'));
  }
  return [];
};

// Función para guardar videos en el archivo JSON
const saveVideosToFile = (videos) => {
  fs.writeFileSync(videosPath, JSON.stringify(videos, null, 2));
};

// Función para leer las asignaciones de videos a páginas
const readPagesVideosFile = () => {
  if (fs.existsSync(pagesVideosPath)) {
    return JSON.parse(fs.readFileSync(pagesVideosPath, 'utf8'));
  }
  return {};
};

// Función para guardar las asignaciones de videos a páginas
const savePagesVideosFile = (data) => {
  fs.writeFileSync(pagesVideosPath, JSON.stringify(data, null, 2));
};

// Crear directorio de videos si no existe
const videoDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// Configuración de Multer para almacenar videos
const storageVideos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/videos'));
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueFilename);
  }
});

const uploadVideos = multer({
  storage: storageVideos,
  limits: { fileSize: 1024 * 1024 * 1024 }, // Límite de 1 GB
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|avi|mkv|mov|webm/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de video (mp4, avi, mkv, mov, webm)'));
    }
  }
}).single('video');

// Controller para la gestión de videos
const videoController = {
  // Subir video
  upload: (req, res) => {
    uploadVideos(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: 'El tamaño del archivo excede el límite de 1 GB' });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo de video' });
      }

      const videoId = Date.now();
      const videoUrl = `/uploads/videos/${req.file.filename}`;
      const newVideo = {
        id: videoId,
        name: req.body.name || 'video',
        filename: req.file.filename,
        url: videoUrl,
        isPrincipal: false
      };

      const videos = readVideosFromFile();
      videos.push(newVideo);
      saveVideosToFile(videos);

      res.json({ success: true, message: 'Video subido con éxito', video: newVideo });
    });
  },

  // Obtener todos los videos
  getAll: (req, res) => {
    const videos = readVideosFromFile();
    res.json({ success: true, videos });
  },

  // Eliminar video por ID
  deleteById: (req, res) => {
    const id = parseInt(req.params.id);
    const videos = readVideosFromFile();
    const video = videos.find(video => video.id === id);

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video no encontrado' });
    }

    const filePath = path.join(__dirname, '../uploads/videos', video.filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        return res.status(500).json({ success: false, message: 'Error al eliminar el archivo físico' });
      }

      const updatedVideos = videos.filter(v => v.id !== id);
      saveVideosToFile(updatedVideos);
      res.json({ success: true, message: 'Video eliminado con éxito' });
    });
  },

  // Actualizar video por ID
  updateById: (req, res) => {
    const id = parseInt(req.params.id);
    const videos = readVideosFromFile();
    const videoIndex = videos.findIndex(video => video.id === id);

    if (videoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Video no encontrado' });
    }

    if (req.file) {
      const newFilename = req.file.filename;
      const oldFilePath = path.join(__dirname, '../uploads/videos', videos[videoIndex].filename);
      videos[videoIndex].filename = newFilename;
      videos[videoIndex].url = `/uploads/videos/${newFilename}`;

      fs.unlink(oldFilePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          return res.status(500).json({ success: false, message: 'Error al eliminar el archivo anterior' });
        }
      });
    }

    if (req.body.name) {
      videos[videoIndex].name = req.body.name;
    }

    saveVideosToFile(videos);
    res.json({ success: true, message: 'Video actualizado con éxito', video: videos[videoIndex] });
  },

  // Marcar video como principal
  setPrincipal: (req, res) => {
    const id = parseInt(req.params.id);
    const videos = readVideosFromFile();
    const videoIndex = videos.findIndex(video => video.id === id);

    if (videoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Video no encontrado' });
    }

    // Marcar todos los videos como no principales
    videos.forEach(video => (video.isPrincipal = false));
    // Marcar el video seleccionado como principal
    videos[videoIndex].isPrincipal = true;
    saveVideosToFile(videos);

    res.json({ success: true, message: `El video ${videos[videoIndex].name} ha sido marcado como principal` });
  },

  // Asignar video a una página
  assignToPage: (req, res) => {
    const { videoName, pageName } = req.body;

    if (!videoName || !pageName) {
      return res.status(400).json({ success: false, message: 'Faltan parámetros (video o página)' });
    }

    const pagesVideos = readPagesVideosFile();
    pagesVideos[pageName] = videoName;  // Asignar video a la página
    savePagesVideosFile(pagesVideos);

    res.json({ success: true, message: `Video ${videoName} asignado a la página ${pageName}` });
  },

  // Obtener el video asignado a una página
  getPageVideo: (req, res) => {
    const pageName = req.params.pageName;
    const pagesVideos = readPagesVideosFile();
    const videoName = pagesVideos[pageName];

    if (videoName) {
      const videos = readVideosFromFile();
      const video = videos.find(v => v.name === videoName);
      if (video) {
        return res.json({ success: true, video });
      }
    }

    res.status(404).json({ success: false, message: 'No se encontró un video asignado a esta página.' });
  }
};

module.exports = videoController;
