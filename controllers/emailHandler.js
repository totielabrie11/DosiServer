const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

// Configuración de Multer para manejar la carga de archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limitar a 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .png, .jpg, .jpeg, y .pdf.'));
    }
  }
});

// Función para enviar el correo electrónico y guardar el contacto en mails.json
async function enviarCorreo(req, res) {
  try {
    const { name, email, phone, message, motivoConsulta } = req.body;
    const file = req.file;
    const mailsPath = path.join(__dirname, '../data/mails.json');


    // Validación del lado del servidor
    if (!name || !email || !phone || !motivoConsulta) {
      return res.status(400).json({
        error: true,
        message: 'El nombre, email, teléfono y motivo de consulta son requeridos.',
      });
    }

    const formattedDate = moment().format('DD-MM-YYYY - HH:mm:ss');

    // Guardar el contacto en mails.json
    const newContact = {
      name,
      email,
      phone,
      message: message || '', // Guardamos el mensaje, aunque esté vacío
      motivoConsulta,
      date: formattedDate
    };

    let contacts = [];
    if (fs.existsSync(mailsPath)) {
      contacts = JSON.parse(fs.readFileSync(mailsPath, 'utf8'));
    }

    contacts.push(newContact);
    fs.writeFileSync(mailsPath, JSON.stringify(contacts, null, 2));

    // Configuración de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cotizaciones@dosivac.com',
        pass: 'kzsu mdmt tkrl ngzr'
      }
    });

    // Asignación del correo de destino según motivo de consulta
    const destinatarios = {
      'Servicio Técnico': 'repuestos@dosivac.com',
      'Consulta Técnica': 'sopladores@dosivac.com', // Nuevo destinatario
      'Refrigeración': 'bombas@dosivac.com',
      'Distribuidor': 'ventatecnica@dosivac.com',
      'Pago a Proveedores': 'pagos.proveedores@example.com',
      'Trabajar con Nosotros': 'curriculumvitae@dosivac.com'
   };
   
   const asuntos = {
      'Servicio Técnico': 'Consulta Web: Solicitud de Servicio Técnico',
      'Consulta Técnica': 'Consulta Web: Solicitud de Consulta Técnica',
      'Pago a Proveedores': 'Consulta Web: Consulta sobre Pagos a Proveedores',
      'Refrigeración': 'Consulta Web: Consulta sobre Refrigeración',
      'Distribuidor': 'Consulta Web: Solicitud para Distribuidor',
      'Trabajar con Nosotros': 'Consulta Web: Aplicación para Trabajar con Nosotros'
   };
   

    const destinatario = destinatarios[motivoConsulta];
    const asunto = asuntos[motivoConsulta];

    if (!destinatario || !asunto) {
      return res.status(400).json({
        error: true,
        message: 'El motivo de consulta no es válido.'
      });
    }

    // Configuración del correo
    let mailOptions = {
      from: email,
      to: destinatario,
      subject: `${asunto} - ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\nTeléfono: ${phone}\nMensaje: ${message || 'No se proporcionó un mensaje.'}`
    };

    // Si hay un archivo adjunto, lo agregamos al correo
    if (file) {
      mailOptions.attachments = [
        {
          filename: file.originalname,
          content: file.buffer
        }
      ];
    }

    // Enviar el correo electrónico
    await transporter.sendMail(mailOptions);
    res.status(201).json({ error: false, message: 'Correo enviado y contacto guardado exitosamente.' });

  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({
      error: true,
      message: 'Error al enviar el correo. Intenta nuevamente más tarde.'
    });
  }
}

module.exports = { upload, enviarCorreo };
