// ============================================
// MODELO DE EMPRESA - BACKEND
// src/models/empresa.model.js
// Esquema para la BD central (admin_db)
// Registra todas las empresas del sistema
// ============================================

const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({

  // Identificador único del tenant
  // Es el valor que el usuario escribe en el login
  // Ejemplo: "empresa1", "credirobo", "prestamos-sa"
  tenantId: {
    type: String,
    required: [true, 'El tenantId es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9\-]+$/,
      'Solo se permiten letras, números y guiones'
    ]
  },

  // Nombre comercial de la empresa
  nombre: {
    type: String,
    required: [true, 'El nombre de la empresa es obligatorio'],
    trim: true
  },

  // Email de contacto del administrador de la empresa
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'El formato del email no es válido'
    ]
  },
   admin_email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },

  
  // Se llena cuando el admin escribe /adminstart al bot
  admin_telegram_chat_id: {
    type: String,
    default: null
  },

  // Estado de la empresa — solo las activas pueden hacer login
  activa: {
    type: Boolean,
    default: true
  },

  // Fecha en que se creó la empresa en el sistema
  fechaRegistro: {
    type: Date,
    default: Date.now
  },

  // Notas internas del superadmin (opcional)
  notas: {
    type: String,
    trim: true,
    default: ''
  }

}, {
  timestamps: true,
  versionKey: false
});

// ============================================
// FUNCIÓN PARA OBTENER EL MODELO
// Usa la conexión de admin_db
// @param {mongoose.Connection} connection
// @returns {mongoose.Model}
// ============================================
const getEmpresaModel = (connection) => {
  if (connection.models.Empresa) {
    return connection.models.Empresa;
  }
  return connection.model('Empresa', empresaSchema);
};

module.exports = getEmpresaModel;