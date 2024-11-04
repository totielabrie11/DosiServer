const express = require('express'); // Asegúrate de requerir express
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');

const router = express.Router(); // Aquí defines el router

const getSectionsFromPages = () => {
  const pagesDirectory = path.join(__dirname, '..', 'src', 'components', 'Home', 'Pages'); // Directorio donde están los archivos JSX
  const sectionData = [];

  console.log(`Escaneando el directorio: ${pagesDirectory}`);

  if (fs.existsSync(pagesDirectory)) {
    const files = fs.readdirSync(pagesDirectory);
    console.log(`Archivos encontrados en el directorio: ${files}`);

    files.forEach((file) => {
      if (file.endsWith('.jsx')) {
        const filePath = path.join(pagesDirectory, file);
        console.log(`Leyendo archivo JSX: ${filePath}`);

        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Usar @babel/parser para analizar el código JSX
        const ast = babelParser.parse(fileContent, {
          sourceType: 'module',
          plugins: ['jsx'], // Habilitar el análisis de JSX
        });

        // Usar babel-traverse para encontrar las etiquetas <section>
        traverse(ast, {
          JSXElement(path) {
            const nodeName = path.node.openingElement.name.name;
            if (nodeName === 'section') {
              let name = null;

              // Buscar la etiqueta <h2> dentro de la sección
              path.traverse({
                JSXElement(innerPath) {
                  const innerNodeName = innerPath.node.openingElement.name.name;
                  if (innerNodeName === 'h2') {
                    // Intentar encontrar el texto dentro del <h2>
                    innerPath.node.children.forEach((child) => {
                      if (child.type === 'JSXText') {
                        name = child.value.trim(); // Obtener el texto dentro del <h2> y eliminar espacios en blanco
                      }
                    });
                  }
                }
              });

              if (name) {
                sectionData.push({ name, page: file.replace('.jsx', '') });
                console.log(`Sección encontrada: Nombre = ${name}, Página = ${file.replace('.jsx', '')}`);
              }
            }
          }
        });
      } else {
        console.log(`Archivo ignorado (no es JSX): ${file}`);
      }
    });
  } else {
    console.error(`Directorio no encontrado: ${pagesDirectory}`);
  }

  console.log('Secciones recopiladas:', sectionData);

  return sectionData;
};


// Endpoint para obtener las secciones de las páginas
router.get('/api/pages/sections', (req, res) => {
  const sections = getSectionsFromPages();
  console.log('Enviando secciones al frontend:', sections);
  res.json({ sections });
});

module.exports = router; // Exporta el router
