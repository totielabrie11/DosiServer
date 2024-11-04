// Backend actualizado con manejo de errores mejorado
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const ASSIGNMENTS_FILE = path.join(__dirname, '..', 'data', 'pageAssignments.json');

// Función para leer el archivo de asignaciones
const readAssignmentsFile = async () => {
  try {
    const data = await fs.readFile(ASSIGNMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { aplicarPaginas: [] }; // Retornar objeto vacío si el archivo no existe
    }
    throw err;
  }
};

// Función para escribir en el archivo de asignaciones
const writeAssignmentsFile = async (assignments) => {
  try {
    await fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2), 'utf8');
  } catch (err) {
    throw err;
  }
};

// Agregar un GET para obtener las asignaciones
router.get('/api/pages/assignments', async (req, res) => {
  try {
    const assignments = await readAssignmentsFile();
    res.status(200).json(assignments);
  } catch (err) {
    console.error('Error al obtener las asignaciones:', err);
    res.status(500).json({ message: 'Error al obtener las asignaciones.' });
  }
});

// Endpoint para asignar múltiples páginas
router.post('/api/pages/assign-multiple', async (req, res) => {
  const { photoName, pageName, section } = req.body;

  if (!photoName || !pageName || !section) {
    return res.status(400).json({ message: 'Faltan parámetros.' });
  }

  try {
    const assignments = await readAssignmentsFile();

    // Asegurarse de que "aplicarPaginas" está bien inicializado
    if (!assignments.aplicarPaginas) {
      assignments.aplicarPaginas = {};
    }

    // Asegurarse de que la página (pageName) esté inicializada como un array dentro de "aplicarPaginas"
    if (!assignments.aplicarPaginas[pageName]) {
      assignments.aplicarPaginas[pageName] = [];
    }

    // Añadir o actualizar la asignación para la sección especificada
    const existingIndex = assignments.aplicarPaginas[pageName].findIndex(
      assignment => assignment.section === section
    );

    if (existingIndex !== -1) {
      assignments.aplicarPaginas[pageName][existingIndex] = { section, photoName };
    } else {
      assignments.aplicarPaginas[pageName].push({ section, photoName });
    }

    await writeAssignmentsFile(assignments);
    res.status(200).json({ message: 'Asignación realizada con éxito.' });
  } catch (err) {
    console.error('Error al procesar las asignaciones:', err);
    res.status(500).json({ message: 'Error al procesar las asignaciones.' });
  }
});

// Endpoint para guardar la selección
router.post('/api/save-selection', async (req, res) => {
  const { photoName, pageName, section } = req.body;

  console.log('Solicitud recibida:', req.body); // Log para verificar que la solicitud llega correctamente

  if (!photoName || !pageName || !section) {
    return res.status(400).json({ success: false, message: 'Faltan datos para guardar la selección.' });
  }

  try {
    let selections = [];
    try {
      const data = await fs.readFile(ASSIGNMENTS_FILE, 'utf8');
      selections = JSON.parse(data);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error al leer el archivo de asignaciones:', err);
        throw err;
      }
    }

    // Agregar la nueva selección
    selections.push({ photoName, pageName, section });

    // Guardar el archivo actualizado
    await fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(selections, null, 2), 'utf8');
    res.json({ success: true, message: 'Selección guardada exitosamente.' });
  } catch (err) {
    console.error('Error al guardar la selección:', err);
    res.status(500).json({ success: false, message: 'Error al guardar la selección.', error: err.message });
  }
});

module.exports = router;
