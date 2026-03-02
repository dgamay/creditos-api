/* const router = require('express').Router();
const ctrl = require('../controllers/cliente.controller');

router.post('/', ctrl.create);
router.get('/', ctrl.getByCobrador);


module.exports = router;


 */
const router = require('express').Router();
const ctrl = require('../controllers/cliente.controller');

// ============================================
// RUTAS DE CLIENTES
// ============================================

// Crear un nuevo cliente
router.post('/', ctrl.create);

// Obtener clientes filtrados por cobrador (usando Query Params o el ID en la ruta)
router.get('/', ctrl.getByCobrador);

// Obtener un cliente específico por su ID
//router.get('/:id', ctrl.getById);

// Actualizar un cliente por ID
router.put('/:id', ctrl.update);

// Eliminar un cliente por ID
router.delete('/:id', ctrl.delete);

module.exports = router;
