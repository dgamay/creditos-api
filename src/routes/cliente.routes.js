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

// routes/cliente.routes.js
router.get('/buscar-semantico', async (req, res) => {
    try {
        const { query, cobrador_id } = req.query;
        const tenantConnection = req.tenantConnection; // Tu middleware de tenant
        
        const resultados = await buscarClientesSimilares(
            tenantConnection,
            query,
            { 
                limit: 5,
                filtroCobrador: cobrador_id ? new mongoose.Types.ObjectId(cobrador_id) : null
            }
        );
        
        res.json({ exitoso: true, data: resultados });
    } catch (error) {
        res.status(500).json({ exitoso: false, error: error.message });
    }
});

module.exports = router;
