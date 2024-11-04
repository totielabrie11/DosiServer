const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const ASSIGNMENTS_FILE = path.join(__dirname, '..', 'data', 'pageAssignments.json');

// Verificar si el archivo `pageAssignments.json` existe, si no, crearlo con un contenido vacío
if (!fs.existsSync(ASSIGNMENTS_FILE)) {
  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify([]));
}

// Endpoint para obtener las páginas existentes
router.get('/api/pages', (req, res) => {
  fs.readdir(PAGES_DIR, (err, files) => {
    if (err) {
      console.error('Error al leer las páginas en la ruta:', PAGES_DIR, err);
      return res.status(500).json({ message: 'Error al leer las páginas.' });
    }

    const pages = files
      .filter(file => file.endsWith('.jsx'))
      .map(file => file.replace('.jsx', ''));  // Remueve la extensión .jsx

    res.json({ pages });
  });
});

// Endpoint para asignar un fondo de pantalla a una página
router.post('/api/pages/assign', (req, res) => {
  const { photoName, pageName } = req.body;

  if (!photoName || !pageName) {
    return res.status(400).json({ message: 'Faltan parámetros.' });
  }

  // Leer el archivo de asignaciones
  fs.readFile(ASSIGNMENTS_FILE, 'utf8', (err, data) => {
    let assignments = {};
    if (!err && data) {
      assignments = JSON.parse(data);  // Parsear el archivo existente si existe
    }

    // Asignar el fondo de pantalla a la página
    assignments[pageName] = photoName;

    // Guardar la nueva asignación
    fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al guardar la asignación.' });
      }

      res.json({ success: true, message: `Fondo ${photoName} asignado a la página ${pageName}.` });
    });
  });
});

// Endpoint para obtener el fondo de pantalla asignado a una página
router.get('/api/pages/:pageName/fondo', (req, res) => {
  const { pageName } = req.params;

  fs.readFile(ASSIGNMENTS_FILE, 'utf8', (err, data) => {
    if (err || !data) {
      return res.status(404).json({ message: 'No se encontró ninguna asignación.' });
    }

    const assignments = JSON.parse(data);

    if (!assignments[pageName]) {
      return res.status(404).json({ message: 'No se encontró ninguna asignación para esta página.' });
    }

    res.json({ fondo: assignments[pageName] });
  });
});

// Nuevo Endpoint para obtener el fondo condicional de una página
router.get('/api/background/:page', (req, res) => {
  const { page } = req.params;

  fs.readFile(ASSIGNMENTS_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer la asignación de páginas.' });
    }

    const pageAssignments = JSON.parse(data);

    // Obtener el fondo correspondiente a la página
    const background = pageAssignments[page];

    if (background) {
      res.json({ background });
    } else {
      res.status(404).json({ error: 'Fondo no encontrado para la página especificada.' });
    }
  });
});

// Endpoint para eliminar la asignación de fondo de pantalla de una página
router.delete('/api/pages/:pageName/fondo', (req, res) => {
  const { pageName } = req.params;

  fs.readFile(ASSIGNMENTS_FILE, 'utf8', (err, data) => {
    if (err || !data) {
      return res.status(404).json({ message: 'No se encontró ninguna asignación.' });
    }

    const assignments = JSON.parse(data);

    if (!assignments[pageName]) {
      return res.status(404).json({ message: 'No se encontró ninguna asignación para esta página.' });
    }

    delete assignments[pageName];

    fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al eliminar la asignación.' });
      }

      res.json({ success: true, message: `La asignación del fondo para la página ${pageName} fue eliminada.` });
    });
  });
});

module.exports = router;