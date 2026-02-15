// Importa Express
const express = require('express');

// Crea la app
const app = express();

// Permite recibir datos JSON en requests
app.use(express.json());

// Ruta base para verificar que la API funciona
app.get('/', (req, res) => {
    res.send('API de créditos funcionando');
});

// Rutas separadas por recurso
app.use('/api/cobradores', require('./routes/cobrador.routes'));
app.use('/api/clientes', require('./routes/cliente.routes'));
app.use('/api/creditos', require('./routes/credito.routes'));

module.exports = app;
