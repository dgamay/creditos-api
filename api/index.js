const app = require('../src/app');
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
