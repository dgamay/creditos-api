const express = require('express');
const router = express.Router();
const { searchConocimiento } = require('../controllers/conocimiento.controller');

// GET /api/conocimiento/search?q=texto&categoria=faq&limit=3
router.get('/search', searchConocimiento);

// Aquí podrías agregar más rutas (CRUD, inserción, etc.)

module.exports = router;