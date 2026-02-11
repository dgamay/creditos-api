// Configuración principal de Express
const express = require('express');
require('dotenv').config();

const app = express();

// Middleware para leer JSON
app.use(express.json());

// Rutas
app.use('/api', require('./routes/cobrador.routes'));
app.use('/api', require('./routes/cliente.routes'));
app.use('/api', require('./routes/credito.routes'));

module.exports = app;
