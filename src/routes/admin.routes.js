// ============================================
// RUTAS DE ADMIN - BACKEND
// src/routes/admin.routes.js
// Todas las rutas están protegidas por
// adminMiddleware que verifica X-Admin-Secret
// ============================================

const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const adminMiddleware = require('../middlewares/admin.middleware');

// Aplicar adminMiddleware a TODAS las rutas de este router
// Ninguna ruta es accesible sin el secret correcto
router.use(adminMiddleware);

// GET /api/admin/verify — verificar acceso
router.get('/verify', ctrl.verify);

// GET /api/admin/empresas — listar todas las empresas
router.get('/empresas', ctrl.getEmpresas);

// POST /api/admin/empresas — crear nueva empresa
router.post('/empresas', ctrl.createEmpresa);

// PUT /api/admin/empresas/:id/toggle — activar/desactivar
router.put('/empresas/:id/toggle', ctrl.toggleEmpresa);

// DELETE /api/admin/empresas/:id — eliminar empresa
router.delete('/empresas/:id', ctrl.deleteEmpresa);

// GET /api/admin/stats — estadísticas globales
router.get('/stats', ctrl.getStats);

module.exports = router;