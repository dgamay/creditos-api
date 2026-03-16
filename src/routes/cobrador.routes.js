// Importa router de express
const router = require('express').Router();

// Importa controlador
const ctrl = require('../controllers/cobrador.controller');

// POST /api/cobradores
router.post('/', ctrl.create);

// GET /api/cobradores
router.get('/', ctrl.getAll);

router.put('/:id', ctrl.update);    
router.delete('/:id', ctrl.delete); 

// Exporta rutas
module.exports = router;
