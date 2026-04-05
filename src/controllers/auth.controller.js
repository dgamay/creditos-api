// ============================================
// CONTROLADOR DE AUTENTICACIÓN - BACKEND
// src/controllers/auth.controller.js
// Maneja el login de cobradores con
// cédula + contraseña
// ============================================

const bcrypt = require('bcryptjs');
const getCobradorModel = require('../models/cobrador.model');

// ============================================
// LOGIN DE COBRADOR
// POST /api/auth/cobrador/login
// Body: { cedula, password, tenantId }
// El tenantId viene del header X-Tenant-ID
// que ya fue procesado por tenantMiddleware
// ============================================
exports.loginCobrador = async (req, res) => {
  try {
    const { cedula, password } = req.body;

    // Validar que vengan los campos requeridos
    if (!cedula || !password) {
      return res.status(400).json({
        error: 'La cédula y la contraseña son obligatorias'
      });
    }

    // Obtener modelo del tenant actual
    const Cobrador = getCobradorModel(req.db);

    // Buscar cobrador por cédula
    const cobrador = await Cobrador.findOne({ cedula: cedula.trim() });

    // Si no existe el cobrador
    if (!cobrador) {
      return res.status(401).json({
        error: 'Cédula o contraseña incorrecta'
      });
    }

    // Si el cobrador no tiene contraseña asignada aún
    if (!cobrador.password) {
      return res.status(401).json({
        error: 'Este cobrador aún no tiene acceso al sistema. Contacta al administrador.'
      });
    }

    // Si el cobrador está inactivo
    if (!cobrador.activo) {
      return res.status(401).json({
        error: 'Tu cuenta está desactivada. Contacta al administrador.'
      });
    }

    // Comparar contraseña ingresada con el hash guardado
    const passwordValida = await cobrador.compararPassword(password);

    if (!passwordValida) {
      return res.status(401).json({
        error: 'Cédula o contraseña incorrecta'
      });
    }

    // ✅ Login exitoso — devolver datos del cobrador
    // NO devolver el campo password por seguridad
    console.log(`✅ Login exitoso cobrador: ${cobrador.nombre} (${req.tenant})`);

    res.json({
      ok: true,
      cobrador: {
        _id: cobrador._id,
        nombre: cobrador.nombre,
        cedula: cobrador.cedula,
        celular: cobrador.celular,
        direccion: cobrador.direccion,
        tenant: req.tenant
      }
    });

  } catch (error) {
    console.error('❌ Error en login cobrador:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ASIGNAR O CAMBIAR CONTRASEÑA DEL COBRADOR
// PUT /api/auth/cobrador/:id/password
// Solo el admin puede llamar este endpoint
// Body: { password }
// Requiere X-Tenant-ID (pasa por tenantMiddleware)
// ============================================
exports.setPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validar contraseña
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Hashear la contraseña antes de guardar
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Obtener modelo del tenant
    const Cobrador = getCobradorModel(req.db);

    // Actualizar solo el campo password
    const cobrador = await Cobrador.findByIdAndUpdate(
      id,
      { password: passwordHash },
      { new: true }
    );

    if (!cobrador) {
      return res.status(404).json({ error: 'Cobrador no encontrado' });
    }

    console.log(`🔑 Password asignada al cobrador: ${cobrador.nombre}`);

    res.json({
      ok: true,
      message: `Contraseña asignada exitosamente a ${cobrador.nombre}`
    });

  } catch (error) {
    console.error('❌ Error al asignar contraseña:', error);
    res.status(500).json({ error: error.message });
  }
};