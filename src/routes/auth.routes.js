// ============================================
// RUTAS DE AUTENTICACIÓN - BACKEND
// src/routes/auth.routes.js
// Rutas para login de cobradores y
// asignación de contraseñas por el admin
// Requieren X-Tenant-ID (pasan por
// tenantMiddleware y databaseMiddleware)
// ============================================

const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

// POST /api/auth/cobrador/login
// Login del cobrador con cédula + contraseña
// No requiere autenticación previa
router.post('/cobrador/login', ctrl.loginCobrador);

// PUT /api/auth/cobrador/:id/password
// Asignar o cambiar contraseña de un cobrador
// Solo debe llamarlo el admin desde el frontend
router.put('/cobrador/:id/password', ctrl.setPassword);

module.exports = router;