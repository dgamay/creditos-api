// Punto de entrada del servidor

const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Levanta servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
