const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ruta del archivo JSON
const dataDir = path.join(__dirname, 'data'); // Ajusta esta ruta según tu estructura
const productosDescriptionPath = path.join(dataDir, 'productosDescription.json');

// Endpoint para eliminar un producto
router.delete('/api/product-descriptions', (req, res) => {
  const { name } = req.body;

  // Validar que se envíe el nombre del producto
  if (!name) {
    return res.status(400).json({ success: false, message: 'Falta el nombre del producto.' });
  }

  try {
    // Leer el archivo JSON
    const descriptions = JSON.parse(fs.readFileSync(productosDescriptionPath, 'utf-8'));

    // Filtrar para eliminar el producto
    const filteredDescriptions = descriptions.filter((product) => product.name !== name);

    // Si la longitud no cambia, el producto no se encontró
    if (filteredDescriptions.length === descriptions.length) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    // Escribir el nuevo contenido en el archivo
    fs.writeFileSync(productosDescriptionPath, JSON.stringify(filteredDescriptions, null, 2), 'utf-8');

    res.json({ success: true, message: `Producto "${name}" eliminado exitosamente.` });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

module.exports = router;
