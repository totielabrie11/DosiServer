const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Definir la ruta del archivo JSON
const dataPath = path.join(__dirname, '../data/equiposConfigurables.json');

// Endpoint para obtener la configuración del archivo JSON
router.get('/api/equipos', (req, res) => {
  try {
    // Verificar si el archivo existe
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      res.status(200).json(data);
    } else {
      res.status(404).json({ message: 'Archivo no encontrado' });
    }
  } catch (error) {
    console.error('Error al leer el archivo JSON:', error);
    res.status(500).json({ message: 'Error al obtener los datos' });
  }
});

// Ruta para el archivo `equiposConfigurablesBomba.json`
const bombasDataPath = path.join(__dirname, '../data/equiposConfigurablesBomba.json');

// Endpoint para obtener la configuración de bombas
router.get('/api/equipos/bombas', (req, res) => {
  try {
    if (fs.existsSync(bombasDataPath)) {
      const data = JSON.parse(fs.readFileSync(bombasDataPath, 'utf-8'));
      res.status(200).json(data);
    } else {
      res.status(404).json({ message: 'Archivo de bombas no encontrado' });
    }
  } catch (error) {
    console.error('Error al leer el archivo JSON:', error);
    res.status(500).json({ message: 'Error al obtener los datos de las bombas' });
  }
});

module.exports = router;
