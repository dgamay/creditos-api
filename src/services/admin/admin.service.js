// ============================================
// SERVICIO DE ADMINISTRACIÓN - SUPERADMIN
// Maneja todas las peticiones al endpoint /api/admin
// Usa un cliente HTTP separado con ADMIN_SECRET en headers
// ============================================

import axios from 'axios';
import { API_BASE_URL } from '../../core/config/api.config';

// ============================================
// CLIENTE HTTP EXCLUSIVO PARA ADMIN
// No usa el httpClient normal porque necesita
// el header ADMIN_SECRET en lugar de X-Tenant-ID
// ============================================
const adminClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ============================================
// INTERCEPTOR DE REQUEST
// Agrega ADMIN_SECRET en cada petición admin
// El secret se guarda en sessionStorage al hacer login
// ============================================
adminClient.interceptors.request.use(request => {
  const adminSecret = sessionStorage.getItem('adminSecret');
  
  if (adminSecret) {
    request.headers['X-Admin-Secret'] = adminSecret;
  }
  
  console.log('🔐 Admin request:', request.method.toUpperCase(), request.url);
  return request;
});

// ============================================
// INTERCEPTOR DE RESPONSE
// Manejo centralizado de errores admin
// ============================================
adminClient.interceptors.response.use(
  response => {
    console.log('✅ Admin response:', response.status, response.config.url);
    return response.data;
  },
  error => {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;
    
    console.error('❌ Admin error:', status, message);
    
    // Si el secret es inválido, limpiar sesión admin
    if (status === 401 || status === 403) {
      sessionStorage.removeItem('adminSecret');
      console.warn('🔒 Sesión admin expirada o no autorizada');
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// FUNCIONES DEL SERVICIO
// ============================================

const adminService = {

  // ------------------------------------------
  // VERIFICAR CREDENCIALES DE SUPERADMIN
  // Guarda el secret en sessionStorage si es válido
  // @param {string} secret - Clave del superadmin
  // @returns {Promise<boolean>} - true si es válido
  // ------------------------------------------
  login: async (secret) => {
    try {
      // Guardar temporalmente para hacer la petición de verificación
      sessionStorage.setItem('adminSecret', secret);
      
      // Verificar contra el backend
      await adminClient.get('/admin/verify');
      
      console.log('✅ Admin autenticado correctamente');
      return true;
      
    } catch (error) {
      // Si falla, limpiar el secret guardado
      sessionStorage.removeItem('adminSecret');
      console.error('❌ Credenciales de admin inválidas');
      throw new Error('Credenciales incorrectas');
    }
  },

  // ------------------------------------------
  // CERRAR SESIÓN ADMIN
  // ------------------------------------------
  logout: () => {
    sessionStorage.removeItem('adminSecret');
    console.log('👋 Sesión admin cerrada');
  },

  // ------------------------------------------
  // VERIFICAR SI HAY SESIÓN ADMIN ACTIVA
  // @returns {boolean}
  // ------------------------------------------
  isAuthenticated: () => {
    return !!sessionStorage.getItem('adminSecret');
  },

  // ------------------------------------------
  // OBTENER TODAS LAS EMPRESAS
  // @returns {Promise<Array>} - Lista de empresas
  // ------------------------------------------
  getEmpresas: async () => {
    try {
      const data = await adminClient.get('/admin/empresas');
      return data;
    } catch (error) {
      console.error('❌ Error al obtener empresas:', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // CREAR NUEVA EMPRESA
  // @param {Object} empresaData - { tenantId, nombre, email }
  // @returns {Promise<Object>} - Empresa creada
  // ------------------------------------------
  createEmpresa: async (empresaData) => {
    try {
      const data = await adminClient.post('/admin/empresas', empresaData);
      return data;
    } catch (error) {
      console.error('❌ Error al crear empresa:', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // ACTIVAR O DESACTIVAR EMPRESA
  // @param {string} id - ID de la empresa
  // @param {boolean} activa - true para activar, false para desactivar
  // @returns {Promise<Object>} - Empresa actualizada
  // ------------------------------------------
  toggleEmpresa: async (id, activa) => {
    try {
      const data = await adminClient.put(`/admin/empresas/${id}/toggle`, { activa });
      return data;
    } catch (error) {
      console.error('❌ Error al cambiar estado de empresa:', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // ELIMINAR EMPRESA
  // @param {string} id - ID de la empresa
  // @returns {Promise<Object>} - Confirmación
  // ------------------------------------------
  deleteEmpresa: async (id) => {
    try {
      const data = await adminClient.delete(`/admin/empresas/${id}`);
      return data;
    } catch (error) {
      console.error('❌ Error al eliminar empresa:', error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // OBTENER ESTADÍSTICAS GLOBALES
  // @returns {Promise<Object>} - Stats de todas las empresas
  // ------------------------------------------
  getStats: async () => {
    try {
      const data = await adminClient.get('/admin/stats');
      return data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error.message);
      throw error;
    }
  }
};

export default adminService;