const fs = require('fs');
const path = require('path');

// Controlador para manejar la lógica de guardar y recuperar datos
const fotoTextController = {
  // Método POST para guardar o actualizar las descripciones
  save: (req, res) => {
    const dataPath = path.join(__dirname, '../data/fotoText.json');
    const { name, description, fontFamily, fontColor, textTransform, backgroundColor, pageName, paginaAsignar } = req.body;

    // Validar campos obligatorios
    if (!name || !fontFamily || !fontColor || !textTransform || !backgroundColor) {
      console.log('Error: Faltan datos requeridos para guardar la descripción.', req.body);
      return res.status(400).json({ error: 'El nombre, el tipo de letra, el color de letra, la transformación del texto y el color de fondo son requeridos.' });
    }

    try {
      let jsonData = [];

      // Verificar si el archivo ya existe y leerlo
      if (fs.existsSync(dataPath)) {
        const fileData = fs.readFileSync(dataPath);
        jsonData = JSON.parse(fileData);
      } else {
        // Crear el archivo si no existe
        fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2));
      }

      // Verificar si ya existe una entrada con el mismo nombre
      const existingIndex = jsonData.findIndex(entry => entry.name === name);
      const sanitizedBackgroundColor = backgroundColor.includes('NaN') || backgroundColor.includes('undefined') ? 'rgba(0, 0, 0, 0)' : backgroundColor;

      // Determinar si usamos pageName o paginaAsignar, según qué campo esté presente
      const pageField = paginaAsignar ? { paginaAsignar } : { pageName };

      if (existingIndex !== -1) {
        // Actualizar la entrada existente
        console.log('Actualizando descripción existente:', { name, description, fontFamily, fontColor, textTransform, backgroundColor: sanitizedBackgroundColor, ...pageField });
        jsonData[existingIndex].description = description;
        jsonData[existingIndex].fontFamily = fontFamily;
        jsonData[existingIndex].fontColor = fontColor;
        jsonData[existingIndex].textTransform = textTransform;
        jsonData[existingIndex].backgroundColor = sanitizedBackgroundColor;

        // Actualizar pageName o paginaAsignar según sea el caso
        if (paginaAsignar) {
          jsonData[existingIndex].paginaAsignar = paginaAsignar;
          delete jsonData[existingIndex].pageName; // Remover pageName si antes existía
        } else {
          jsonData[existingIndex].pageName = pageName;
          delete jsonData[existingIndex].paginaAsignar; // Remover paginaAsignar si antes existía
        }
      } else {
        // Crear una nueva entrada
        console.log('Guardando nueva descripción:', { name, description, fontFamily, fontColor, textTransform, backgroundColor: sanitizedBackgroundColor, ...pageField });
        const newEntry = {
          name,
          description,
          fontFamily,
          fontColor,
          textTransform,
          backgroundColor: sanitizedBackgroundColor,
          ...pageField
        };
        jsonData.push(newEntry);
      }

      // Guardar los cambios en el archivo JSON
      fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2));
      console.log('Descripción guardada correctamente.');
      return res.status(201).json({ message: 'Descripción guardada correctamente.' });
    } catch (error) {
      console.error('Error al guardar la descripción:', error);
      return res.status(500).json({ error: 'Error al guardar la descripción.' });
    }
  },

  // Método GET para obtener todas las descripciones guardadas
  getAll: (req, res) => {
    const dataPath = path.join(__dirname, '../data/fotoText.json');

    try {
      if (fs.existsSync(dataPath)) {
        const fileData = fs.readFileSync(dataPath, 'utf8');
        const jsonData = JSON.parse(fileData);

        // Asegurarse de que los valores NaN se manejen adecuadamente
        const sanitizedData = jsonData.map(entry => {
          if (entry.backgroundColor && (entry.backgroundColor.includes('NaN') || entry.backgroundColor.includes('undefined'))) {
            entry.backgroundColor = 'rgba(0, 0, 0, 0)';
          }
          return entry;
        });

        console.log('Datos enviados:', sanitizedData);
        return res.status(200).json(sanitizedData);
      } else {
        console.log('Archivo JSON no encontrado. No hay datos disponibles.');
        return res.status(404).json({ message: 'No se encontraron descripciones.' });
      }
    } catch (error) {
      console.error('Error al obtener las descripciones:', error);
      return res.status(500).json({ error: 'Error al obtener las descripciones.' });
    }
  }
};

module.exports = fotoTextController;
