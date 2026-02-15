// Importa mongoose para conectar MongoDB
const mongoose = require('mongoose');

// Función async para conectar BD
const conectarDB = async () => {
    try {
        // Conecta usando URI del .env
        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB conectado');
    } catch (error) {

        // Si falla, muestra error y detiene app
        console.error('Error Mongo:', error.message);
        process.exit(1);
    }
};

module.exports = conectarDB;
