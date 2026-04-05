// ============================================
// MODELO DE COBRADOR - BACKEND
// src/models/cobrador.model.js
// Actualizado para soportar autenticación
// con cédula + contraseña hasheada
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cobradorSchema = new mongoose.Schema({

  // Datos personales
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  cedula: {
    type: String,
    required: [true, 'La cédula es obligatoria'],
    unique: true,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  celular: {
    type: String,
    required: [true, 'El celular es obligatorio'],
    trim: true
  },

  // ✅ Contraseña hasheada con bcrypt
  // El admin la asigna al crear o editar el cobrador
  password: {
    type: String,
    default: null // null = cobrador sin acceso aún
  },

  // ✅ Estado del cobrador
  // false = no puede iniciar sesión aunque tenga contraseña
  activo: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true,
  versionKey: false
});

// ============================================
// MÉTODO PARA COMPARAR CONTRASEÑA
// Usado en el login del cobrador
// @param {string} passwordIngresada - Texto plano
// @returns {Promise<boolean>}
// ============================================
cobradorSchema.methods.compararPassword = async function(passwordIngresada) {
  if (!this.password) return false;
  return await bcrypt.compare(passwordIngresada, this.password);
};

// ============================================
// FUNCIÓN PARA OBTENER EL MODELO
// @param {mongoose.Connection} connection
// @returns {mongoose.Model}
// ============================================
const getCobradorModel = (connection) => {
  if (connection.models.Cobrador) {
    return connection.models.Cobrador;
  }
  return connection.model('Cobrador', cobradorSchema);
};

module.exports = getCobradorModel;