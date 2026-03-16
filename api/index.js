/* const app = require('../src/app');
const conectarDB = require('../src/config/database');

let isConnected = false;

// Vercel ejecuta esto en cada request
module.exports = async (req, res) => {

    if (!isConnected) {
        await conectarDB();
        isConnected = true;
    }

    return app(req, res);
};


 */

// api/index.js
require('dotenv').config();
const app = require('../src/app');

// En Vercel serverless, simplemente exportamos la app
// Las conexiones por tenant se manejan en database.middleware.js
module.exports = app;
