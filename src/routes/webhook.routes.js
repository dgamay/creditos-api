// ============================================
// WEBHOOK ROUTES - BACKEND
// src/routes/webhook.routes.js
// Ruta que Telegram llama con cada mensaje
// NO requiere X-Tenant-ID ni X-Admin-Secret
// Telegram la llama directamente
// ============================================

const router = require('express').Router();
const ctrl = require('../controllers/webhook.controller');

// POST /api/webhook/telegram
// Telegram envía todos los updates aquí
router.post('/telegram', ctrl.procesarMensaje);

module.exports = router;