const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const getGLTFFiles = require('./scripts/getModels'); 
const session = require('express-session');
const { upload, enviarCorreo } = require('./controllers/emailHandler'); 
const fondoController = require('./controllers/fondosController'); 
const pageController = require('./controllers/pageController'); 
const videoController = require('./controllers/videoController'); 
const fotosController = require('./controllers/fotosController'); 
const fotoTextController = require('./controllers/fotoTextController'); 
const header_fondo_controller = require('./controllers/header_fondo_controller'); 
const buscadorSeccionPages = require('./controllers/buscadorSeccionPages'); 
const downloadDbController = require('./controllers/downloadDbController');
const equipoController = require('./controllers/equipoController');
const novedadesController = require('./controllers/novedadesController');
const equiposController = require('./controllers/equiposController');

const app = express();
// Configuración genérica de CORS
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const router = express.Router();

const port = process.env.PORT || 5000;

// Configuración de tamaño límite para JSON
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal');
});

// Configuración de sesiones
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hora de duración de la sesión
}));


// Ruta absoluta al directorio de almacenamiento
const publicDir = path.join(__dirname, 'public');
const modelsDir = path.join(publicDir, 'models');
console.log("🚀 ~ modelsDir:", modelsDir)

// Asegúrate de que el directorio "models" exista
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Usar el controlador de equipos
app.use(equiposController);

app.use(novedadesController);

// Usar fondoController para manejar las rutas relacionadas con fondos
app.use(fondoController);

// Usar pageController para manejar la asignación de fondos de pantalla 
app.use(pageController);

app.use(header_fondo_controller);

app.use(buscadorSeccionPages);

app.get('/api/download-db', downloadDbController.downloadDB);



// Endpoint para el manejo de videos
app.post('/api/videos/upload', videoController.upload);
app.get('/api/videos', videoController.getAll);
app.delete('/api/videos/:id', videoController.deleteById);
app.put('/api/videos/:id', videoController.updateById);
app.put('/api/videos/set-principal/:id', videoController.setPrincipal);

// Endpoint para el manejo de imágenes
app.get('/api/images', fotosController.getAllImages);
app.post('/api/images/upload', fotosController.uploadImages.single('image'), fotosController.uploadImage);
app.delete('/api/images/:filename', fotosController.deleteImage);
app.put('/api/images/:filename', fotosController.uploadImages.single('image'), fotosController.replaceImage);

// Endpoint para el manejo de descripciones de fotos
// Rutas para el manejo de foto y texto
app.post('/api/fotoText/save', fotoTextController.save); // Ruta POST para guardar
app.get('/api/fotoText', fotoTextController.getAll);  

// Definir rutas usando multer y los controladores
app.get('/api/equipo', equipoController.getEquipo);
app.post('/api/equipo', equipoController.createOrUpdateMiembro);
app.delete('/api/equipo/:id', equipoController.deleteMiembro);

// Definir el directorio 'data'
const dataDir = path.join(__dirname, 'data'); 
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });  // Crear el directorio si no existe
}

// Verificar y crear archivos JSON si no existen

// Archivo fotoText.json
const dataPath = path.join(dataDir, 'fotoText.json');
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify([], null, 2));
}

// Archivo mails.json
const mailsPath = path.join(dataDir, 'mails.json'); 
if (!fs.existsSync(mailsPath)) {
  fs.writeFileSync(mailsPath, JSON.stringify([]));
}

// Archivo productosDescription.json
const productosDescriptionPath = path.join(dataDir, 'productosDescription.json');
if (!fs.existsSync(productosDescriptionPath)) {
  fs.writeFileSync(productosDescriptionPath, JSON.stringify([]));
}

// Archivo setterProduct.json
const setterProductPath = path.join(dataDir, 'setterProduct.json');
if (!fs.existsSync(setterProductPath)) {
  fs.writeFileSync(setterProductPath, JSON.stringify([]));
}

// Archivo productOrder.json
const productOrderPath = path.join(dataDir, 'productOrder.json');
if (!fs.existsSync(productOrderPath)) {
  fs.writeFileSync(productOrderPath, JSON.stringify([]));
}

// Archivo us.json (usuarios)
const usersPath = path.join(dataDir, 'us.json');
if (!fs.existsSync(usersPath)) {
  fs.writeFileSync(usersPath, JSON.stringify([]));
}

// Archivo novedades.json
const novedadesPath = path.join(dataDir, 'novedades.json');
if (!fs.existsSync(novedadesPath)) {
  fs.writeFileSync(novedadesPath, JSON.stringify([]));
}

// Archivo equipo.json
const equipoPath = path.join(dataDir, 'equipo.json');
if (!fs.existsSync(equipoPath)) {
  fs.writeFileSync(equipoPath, JSON.stringify([]));
}

// Archivo distribuidores.json
const distribuidoresPath = path.join(dataDir, 'distribuidores.json');
if (!fs.existsSync(distribuidoresPath)) {
  fs.writeFileSync(distribuidoresPath, JSON.stringify([]));
}

// Archivo distribuidores.json
const equiposPath = path.join(dataDir, 'equiposConfigurables.json');
if (!fs.existsSync(equiposPath)) {
  fs.writeFileSync(equiposPath, JSON.stringify([]));
}

// Archivo distribuidores.json
const bombasPath = path.join(dataDir, 'equiposConfigurablesBomba.json');
if (!fs.existsSync(bombasPath)) {
  fs.writeFileSync(bombasPath, JSON.stringify([]));
}


// Funciones auxiliares para leer y escribir archivos JSON

// Leer archivo JSON desde una ruta
const readFileFromPath = (filePath) => {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
};

const saveFileToPath = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Servir la carpeta 'uploads' de forma pública
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir la carpeta de videos de forma pública
app.use('/uploads/videos', express.static(path.join(__dirname, '../uploads/videos')));


// Configuración de Multer
const storageModels = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, modelsDir); // Guardar en "public/models"
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Usar el nombre original del archivo
  },
});

const uploadModels = multer({ storage: storageModels });

// Endpoint para manejo de login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

  const user = users.find(user => user.username === username && user.password === password);
  if (user) {
    res.json({ success: true, username: user.username, role: user.role });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Endpoint para subir productos 3D o imágenes
app.post('/api/upload', uploadModels.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha podido subir el producto' });
  }

  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  const validExtensions = ['.glb', '.gltf', '.jpg', '.png'];

  if (!validExtensions.includes(fileExtension)) {
    return res.status(400).json({ message: 'Tipo de archivo no soportado' });
  }

  // Construir el nombre del producto y la ruta dentro de "public/models"
  const modelName = req.body.name || path.basename(req.file.originalname, fileExtension);
  const modelPath = `/models/${req.file.originalname}`; // Ruta relativa desde "public"

  // Leer y actualizar "productosDescription.json"
  const descriptions = readFileFromPath(productosDescriptionPath);
  const existingProduct = descriptions.find(
    (product) => product.name.toLowerCase() === modelName.toLowerCase()
  );

  if (existingProduct) {
    // Actualizar el producto existente
    if (fileExtension === '.jpg' || fileExtension === '.png') {
      existingProduct['path-image'] = modelPath;
    } else {
      existingProduct.path = modelPath;
    }
  } else {
    // Crear un nuevo producto
    const newProduct = {
      name: modelName,
      description: '',
      path: '',
      'path-image': '',
      caracteristicas: [],
    };
    if (fileExtension === '.jpg' || fileExtension === '.png') {
      newProduct['path-image'] = modelPath;
    } else {
      newProduct.path = modelPath;
    }
    descriptions.push(newProduct);
  }

  saveFileToPath(productosDescriptionPath, descriptions);

  // Actualizar el archivo "productOrder.json"
  const order = readFileFromPath(productOrderPath);
  if (!order.includes(modelName.toLowerCase())) {
    order.push(modelName.toLowerCase());
  }
  saveFileToPath(productOrderPath, order);

  res.status(200).json({ message: 'Producto subido exitosamente', file: req.file });
});

// Registrar productos en la base de datos
function registerProducts(models) {
  const descriptions = readFileFromPath(productosDescriptionPath);
  let order = readFileFromPath(productOrderPath);
  const uniqueProducts = new Map();

  models.forEach(model => {
    if (!uniqueProducts.has(model.name)) {
      uniqueProducts.set(model.name, model);
    } else {
      const existingProduct = uniqueProducts.get(model.name);
      if (model.path.endsWith('.jpg') || model.path.endsWith('.png')) {
        existingProduct['path-image'] = model.path;
      }
    }
  });

  const uniqueModels = Array.from(uniqueProducts.values());

  uniqueModels.forEach(model => {
    const existingProduct = descriptions.find(product => product.name === model.name);
    if (existingProduct) {
      if (model.path.endsWith('.jpg') || model.path.endsWith('.png')) {
        existingProduct['path-image'] = model.path;
      } else {
        existingProduct.path = model.path;
      }
    } else {
      const newProduct = { name: model.name, description: '', path: model.path, caracteristicas: [] };
      if (model.path.endsWith('.jpg') || model.path.endsWith('.png')) {
        newProduct['path-image'] = model.path;
      }
      descriptions.push(newProduct);
      if (!order.includes(model.name)) {
        order.push(model.name);
      }
    }
  });

  saveFileToPath(productosDescriptionPath, descriptions);
  saveFileToPath(productOrderPath, order);
}

// Obtener modelos 3D
app.get('/api/models', (req, res) => {
  const result = getGLTFFiles();
  registerProducts(result.models);
  res.json(result);
});

// Obtener descripciones de productos
app.get('/api/product-descriptions', (req, res) => {
  const descriptions = readFileFromPath(productosDescriptionPath);
  res.json(descriptions);
});

// Obtener orden de productos
app.get('/api/product-order', (req, res) => {
  const order = readFileFromPath(productOrderPath);
  res.json(order);
});

// Establecer el orden de los productos
app.post('/api/product-order', (req, res) => {
  const { order } = req.body;
  saveFileToPath(productOrderPath, order);
  res.json({ success: true });
});

// Ruta para eliminar un producto del orden
app.delete('/api/product-order', (req, res) => {
  const { name } = req.body;

  // Validar que se envíe el nombre del producto
  if (!name) {
    return res.status(400).json({ success: false, message: 'Falta el nombre del producto.' });
  }

  try {
    // Leer el archivo de orden de productos
    let order = JSON.parse(fs.readFileSync(productOrderPath, 'utf-8'));

    // Filtrar para eliminar el nombre del producto
    const filteredOrder = order.filter((productName) => productName !== name);

    // Si no cambia la longitud, el producto no estaba en la lista
    if (filteredOrder.length === order.length) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado en el orden.' });
    }

    // Guardar el nuevo orden en el archivo JSON
    fs.writeFileSync(productOrderPath, JSON.stringify(filteredOrder, null, 2), 'utf-8');

    res.json({
      success: true,
      message: `Producto "${name}" eliminado del orden exitosamente.`,
    });
  } catch (error) {
    console.error('Error al eliminar del orden:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});


// Actualizar descripciones de productos
app.post('/api/product-descriptions', (req, res) => {
  const { name, description } = req.body;
  const descriptions = readFileFromPath(productosDescriptionPath);

  const existingProduct = descriptions.find(product => product.name === name);
  if (existingProduct) {
    existingProduct.description = description;
  } else {
    descriptions.push({ name, description, caracteristicas: [] });
  }

  saveFileToPath(productosDescriptionPath, descriptions);
  res.json({ success: true });
});

// Eliminar un producto
app.delete('/api/product-descriptions', (req, res) => {
  const { name } = req.body;

  // Validar que el nombre del producto esté presente en la solicitud
  if (!name) {
    return res.status(400).json({ success: false, message: 'Falta el nombre del producto.' });
  }

  // Leer el archivo de descripciones de productos
  let descriptions = readFileFromPath(productosDescriptionPath);

  // Buscar el índice del producto a eliminar
  const productIndex = descriptions.findIndex(product => product.name === name);

  if (productIndex === -1) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
  }

  // Eliminar el producto del array
  const [deletedProduct] = descriptions.splice(productIndex, 1);

  // Guardar los cambios en el archivo JSON
  saveFileToPath(productosDescriptionPath, descriptions);

  res.json({
    success: true,
    message: `Producto "${name}" eliminado exitosamente.`,
    deletedProduct, // Se devuelve el producto eliminado para confirmación (opcional)
  });
});


// Endpoint para eliminar un archivo
router.delete('/api/delete-file', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Falta el nombre del archivo.' });
  }

  const normalizedInputName = name.trim().toLowerCase();

  try {
    const files = fs.readdirSync(modelsDir);
    console.log('Archivos disponibles en el directorio:', files);

    const matchingFiles = files.filter(
      (file) => path.parse(file).name.toLowerCase() === normalizedInputName
    );
    console.log('Archivos encontrados para eliminar:', matchingFiles);

    if (matchingFiles.length === 0) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado.' });
    }

    matchingFiles.forEach((file) => {
      const filePath = path.join(modelsDir, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error al eliminar el archivo ${filePath}:`, err);
        } else {
          console.log(`Archivo ${filePath} eliminado exitosamente.`);
        }
      });
    });

    res.json({
      success: true,
      message: `Archivo(s) asociado(s) con "${name}" eliminado(s) exitosamente.`,
      deletedFiles: matchingFiles,
    });
  } catch (error) {
    console.error('Error al eliminar archivo(s):', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});


// Actualizar detalles del producto (manual, folleto)
app.post('/api/product-details', (req, res) => {
  const { name, manual, folleto } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'El nombre del producto es obligatorio.' });
  }

  const descriptions = readFileFromPath(productosDescriptionPath);
  const existingProduct = descriptions.find(product => product.name === name);

  if (existingProduct) {
    if (manual) existingProduct.rutas = { ...existingProduct.rutas, manual };
    if (folleto) existingProduct.rutas = { ...existingProduct.rutas, folleto };

    saveFileToPath(productosDescriptionPath, descriptions);

    return res.status(200).json({ success: true, message: 'Detalles actualizados correctamente.' });
  } else {
    return res.status(404).json({ message: 'Producto no encontrado.' });
  }
});

// Actualizar características de productos
app.post('/api/product-characteristics', (req, res) => {
  const { name, characteristics } = req.body;
  const descriptions = readFileFromPath(productosDescriptionPath);

  const existingProduct = descriptions.find(product => product.name === name);
  if (existingProduct) {
    existingProduct.caracteristicas = characteristics;
  } else {
    descriptions.push({ name, description: '', caracteristicas: characteristics });
  }

  saveFileToPath(productosDescriptionPath, descriptions);
  res.json({ success: true });
});



// Eliminar una descripción de producto, la imagen asociada y su orden
app.delete('/api/product', (req, res) => {
  const { name } = req.body;

  // Leer las descripciones de productos
  let descriptions = readFileFromPath(productosDescriptionPath);

  // Buscar el producto a eliminar
  const productToDelete = descriptions.find(product => product.name === name);
  if (!productToDelete) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
  }

  // Eliminar el producto del archivo de descripciones
  descriptions = descriptions.filter(product => product.name !== name);
  saveFileToPath(productosDescriptionPath, descriptions);

  // Eliminar la imagen asociada al producto
  const imagePath = path.join(__dirname, '../public', productToDelete['path-image']);

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error('Error al eliminar la imagen:', err);
      return res.status(500).json({ success: false, message: 'No se pudo eliminar la imagen.' });
    }

    // Leer el archivo de orden de productos
    let order = readFileFromPath(productOrderPath);

    // Eliminar el nombre del producto del orden
    order = order.filter(productName => productName !== name);
    saveFileToPath(productOrderPath, order);

    // Responder con éxito
    res.json({ success: true });
  });
});



// Establecer configuraciones de productos
app.post('/api/product-settings', (req, res) => {
  const { name, lightIntensity, spotLightIntensity, lightPosition, isAnimating, rotationSpeed } = req.body;
  const settings = readFileFromPath(setterProductPath);

  const existingProduct = settings.find(product => product.name === name);
  if (existingProduct) {
    existingProduct.lightIntensity = lightIntensity;
    existingProduct.spotLightIntensity = spotLightIntensity;
    existingProduct.lightPosition = lightPosition;
    existingProduct.isAnimating = isAnimating;
    existingProduct.rotationSpeed = rotationSpeed;
  } else {
    settings.push({ name, lightIntensity, spotLightIntensity, lightPosition, isAnimating, rotationSpeed });
  }

  saveFileToPath(setterProductPath, settings);
  res.json({ success: true });
});

// Obtener configuraciones de productos
app.get('/api/product-settings', (req, res) => {
  const settings = readFileFromPath(setterProductPath);
  res.json(settings);
});

// Obtener detalles de un producto por nombre
app.get('/api/product/:name', (req, res) => {
  const name = req.params.name;
  const descriptions = readFileFromPath(productosDescriptionPath);
  const product = descriptions.find(product => product.name === name);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// Editar el nombre de un producto
app.post('/api/edit-product-name', (req, res) => {
  const { oldName, newName } = req.body;

  let descriptions = readFileFromPath(productosDescriptionPath);
  const existingProduct = descriptions.find(product => product.name === oldName);
  if (!existingProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const oldFilePath = path.join(__dirname, 'public', 'models', path.basename(existingProduct.path));
  const fileExtension = path.extname(oldFilePath);
  const newFilePath = path.join(__dirname, 'public', 'models', `${newName}${fileExtension}`);

  fs.rename(oldFilePath, newFilePath, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error renaming file', error: err });
    }

    let order = readFileFromPath(productOrderPath);
    order = order.map(name => (name === oldName ? newName : name));
    saveFileToPath(productOrderPath, order);

    let duplicateProduct = descriptions.find(product => product.name === newName);

    if (existingProduct && !duplicateProduct) {
      existingProduct.name = newName;
      existingProduct.path = `/models/${newName}${fileExtension}`;
    } else if (existingProduct && duplicateProduct) {
      duplicateProduct.description = existingProduct.description || duplicateProduct.description;
      duplicateProduct.path = existingProduct.path || duplicateProduct.path;
      duplicateProduct.caracteristicas = [
        ...new Set([...duplicateProduct.caracteristicas, ...existingProduct.caracteristicas])
      ];
      descriptions = descriptions.filter(product => product.name !== oldName);
    }

    saveFileToPath(productosDescriptionPath, descriptions);

    let settings = readFileFromPath(setterProductPath);
    settings = settings.map(setting => {
      if (setting.name === oldName) {
        return { ...setting, name: newName };
      }
      return setting;
    });
    saveFileToPath(setterProductPath, settings);

    res.json({ success: true });
  });
});

// Limpiar el orden de productos
app.get('/api/clean-product-order', (req, res) => {
  let order = readFileFromPath(productOrderPath);
  const uniqueOrder = Array.from(new Set(order));
  saveFileToPath(productOrderPath, uniqueOrder);
  res.json({ success: true, order: uniqueOrder });
});

// Endpoint para obtener los miembros del equipo
app.get('/api/equipo', (req, res) => {
  const equipo = readFileFromPath(equipoPath);
  res.json(equipo);
});



// Endpoint para obtener los distribuidores
app.get('/api/distribuidores', (req, res) => {
  const distribuidores = readFileFromPath(distribuidoresPath);
  res.json(distribuidores);
});

// Crear o editar un distribuidor
app.post('/api/distribuidores', (req, res) => {
  try {
    const { id, nombre, direccion, provincia, telefono, mail, tipo, posicion } = req.body;
    let distribuidores = readFileFromPath(distribuidoresPath);

    if (id) {
      // Editar distribuidor existente
      const distribuidorIndex = distribuidores.findIndex(d => d.id === parseInt(id));
      if (distribuidorIndex !== -1) {
        distribuidores[distribuidorIndex] = {
          ...distribuidores[distribuidorIndex],
          nombre,
          direccion,
          provincia,
          telefono,
          mail,
          tipo,
          posicion
        };
      } else {
        return res.status(404).json({ message: 'Distribuidor no encontrado' });
      }
    } else {
      // Crear un nuevo distribuidor
      const newId = distribuidores.length ? Math.max(...distribuidores.map(d => d.id)) + 1 : 1;
      const newDistribuidor = {
        id: newId,
        nombre,
        direccion,
        provincia,
        telefono,
        mail,
        tipo,
        posicion
      };
      distribuidores.push(newDistribuidor);
    }

    saveFileToPath(distribuidoresPath, distribuidores);
    res.json(distribuidores);
  } catch (error) {
    res.status(500).json({ message: 'Error al procesar el distribuidor', error });
  }
});

// Eliminar distribuidor
app.delete('/api/distribuidores/:id', (req, res) => {
  const { id } = req.params;
  let distribuidores = readFileFromPath(distribuidoresPath);

  const distribuidorToDelete = distribuidores.find(distribuidor => distribuidor.id === parseInt(id));

  if (distribuidorToDelete) {
    distribuidores = distribuidores.filter(distribuidor => distribuidor.id !== parseInt(id));
    saveFileToPath(distribuidoresPath, distribuidores);

    res.json(distribuidores);
  } else {
    res.status(404).json({ message: 'Distribuidor no encontrado' });
  }
});

// Editar un distribuidor
app.put('/api/distribuidores/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, provincia, telefono, mail, tipo, posicion } = req.body;

  let distribuidores = readFileFromPath(distribuidoresPath);
  const distribuidorIndex = distribuidores.findIndex(d => d.id === parseInt(id));

  if (distribuidorIndex !== -1) {
    distribuidores[distribuidorIndex] = {
      id: parseInt(id),
      nombre,
      direccion,
      provincia,
      telefono,
      mail,
      tipo,
      posicion,
    };

    saveFileToPath(distribuidoresPath, distribuidores);
    res.json(distribuidores);
  } else {
    res.status(404).json({ message: 'Distribuidor no encontrado' });
  }
});

// Endpoint para manejar contactos y envío de correos
app.post('/api/contact', upload.single('file'), enviarCorreo);

// Iniciar el servidor
const server = app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});const PORT = process.env.PORT || 10000; // Utiliza el puerto que Render proporciona o un puerto predeterminado

server.setTimeout(10 * 60 * 1000); // 10 minutos de timeout