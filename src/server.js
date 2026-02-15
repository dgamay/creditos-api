// Carga variables de entorno
require('dotenv').config();

// Importa app express
const app = require('./app');

// Importa conexión MongoDB
const conectarDB = require('./config/database');

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Función para iniciar servidor después de conectar BD
const startServer = async () => {

    // Espera conexión MongoDB
    await conectarDB();

    // Inicia servidor HTTP
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
};

// Ejecuta inicio
startServer();
