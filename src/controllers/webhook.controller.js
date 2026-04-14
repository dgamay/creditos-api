// ============================================
// WEBHOOK CONTROLLER - BACKEND
// src/controllers/webhook.controller.js
// Procesa todos los mensajes entrantes de Telegram
// Maneja el flujo de vinculación y comandos
// ============================================

const telegramService = require('../services/telegram.service');
const { getAdminConnection, getTenantConnection } = require('../config/database');
const getCobradorModel = require('../models/cobrador.model');
const getCreditoModel = require('../models/credito.model');
const getClienteModel = require('../models/cliente.model');
const getEmpresaModel = require('../models/empresa.model');

// ============================================
// SESIONES TEMPORALES EN MEMORIA
// Guarda el estado de la conversación por chatId
// Formato: { chatId: { paso, empresa, cedula } }
// ============================================
const sesiones = {};

// ============================================
// ESTADOS DE LA CONVERSACIÓN
// ============================================
const PASOS = {
  INICIO: 'inicio',
  ESPERANDO_EMPRESA: 'esperando_empresa',
  ESPERANDO_CEDULA: 'esperando_cedula',
  VINCULADO: 'vinculado'
};

// ============================================
// OBTENER SESIÓN DEL USUARIO
// Si no existe la crea con estado inicial
// ============================================
const getSesion = (chatId) => {
  if (!sesiones[chatId]) {
    sesiones[chatId] = { paso: PASOS.INICIO };
  }
  return sesiones[chatId];
};

// ============================================
// BUSCAR COBRADOR EN LA BD DEL TENANT
// @param {string} tenantId
// @param {string} cedula
// @returns {Object|null} cobrador encontrado
// ============================================
const buscarCobrador = async (tenantId, cedula) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Cobrador = getCobradorModel(connection);
    return await Cobrador.findOne({ cedula: cedula.trim() });
  } catch (error) {
    console.error('❌ Error buscando cobrador:', error.message);
    return null;
  }
};

// ============================================
// VERIFICAR SI LA EMPRESA EXISTE Y ESTÁ ACTIVA
// @param {string} tenantId
// @returns {Object|null} empresa encontrada
// ============================================
const verificarEmpresa = async (tenantId) => {
  try {
    const connection = await getAdminConnection();
    const Empresa = getEmpresaModel(connection);
    return await Empresa.findOne({
      tenantId: tenantId.toLowerCase().trim(),
      activa: true
    });
  } catch (error) {
    console.error('❌ Error verificando empresa:', error.message);
    return null;
  }
};

// ============================================
// GUARDAR CHAT_ID EN EL COBRADOR
// Vincula el cobrador con Telegram
// ============================================
const vincularCobrador = async (tenantId, cedula, chatId) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Cobrador = getCobradorModel(connection);
    await Cobrador.findOneAndUpdate(
      { cedula: cedula.trim() },
      { telegram_chat_id: String(chatId) },
      { new: true }
    );
    console.log(`✅ Cobrador ${cedula} vinculado con chat ${chatId}`);
  } catch (error) {
    console.error('❌ Error vinculando cobrador:', error.message);
    throw error;
  }
};

// ============================================
// COMANDO /pendientes
// Lista los créditos pendientes del cobrador
// ============================================
const mostrarPendientes = async (chatId, tenantId, cobradorId) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Credito = getCreditoModel(connection);
    const Cliente = getClienteModel(connection);

    // Buscar créditos pendientes del cobrador
    const creditos = await Credito.find({
      cobrador_id: cobradorId,
      estado: 'pendiente'
    });

    if (creditos.length === 0) {
      await telegramService.responder(chatId,
        '✅ <b>No tienes créditos pendientes</b>\n\nTodo al día 🎉'
      );
      return;
    }

    // Construir mensaje con cada crédito
    let mensaje = `📋 <b>Tus créditos pendientes (${creditos.length})</b>\n\n`;

    for (const credito of creditos) {
      const cliente = await Cliente.findById(credito.cliente_id);
      const fechaPago = new Date(credito.fecha_pago);
      const hoy = new Date();
      const vencido = fechaPago < hoy;

      mensaje += `${vencido ? '🔴' : '🟡'} <b>${cliente?.nombre || 'Cliente'}</b>\n`;
      mensaje += `   💰 $${credito.monto_por_pagar?.toLocaleString('es-CO')}\n`;
      mensaje += `   📅 ${fechaPago.toLocaleDateString('es-CO')}`;
      mensaje += vencido ? ' ⚠️ VENCIDO\n\n' : '\n\n';
    }

    await telegramService.responder(chatId, mensaje);

  } catch (error) {
    console.error('❌ Error mostrando pendientes:', error.message);
    await telegramService.responder(chatId,
      '❌ Error al obtener los créditos. Intenta de nuevo.'
    );
  }
};

// ============================================
// COMANDO /ayuda
// Muestra todos los comandos disponibles
// ============================================
const mostrarAyuda = async (chatId) => {
  const mensaje = `
🤖 <b>Comandos disponibles</b>

/start — Vincular tu cuenta
/pendientes — Ver créditos pendientes
/ayuda — Ver esta lista

Para marcar un pago escribe:
<code>/pagar [cédula del cliente]</code>

Para ver datos de un cliente:
<code>/cliente [cédula del cliente]</code>
  `.trim();

  await telegramService.responder(chatId, mensaje);
};

// ============================================
// COMANDO /pagar
// Marca un crédito como pagado
// Uso: /pagar 1234567890
// ============================================
const procesarPago = async (chatId, tenantId, cedulaCliente) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Credito = getCreditoModel(connection);
    const Cliente = getClienteModel(connection);

    // Buscar el cliente por cédula
    const cliente = await Cliente.findOne({ cedula: cedulaCliente.trim() });
    if (!cliente) {
      await telegramService.responder(chatId,
        `❌ No encontré ningún cliente con cédula <b>${cedulaCliente}</b>`
      );
      return;
    }

    // Buscar crédito pendiente del cliente
    const credito = await Credito.findOne({
      cliente_id: cliente._id,
      estado: 'pendiente'
    });

    if (!credito) {
      await telegramService.responder(chatId,
        `ℹ️ <b>${cliente.nombre}</b> no tiene créditos pendientes.`
      );
      return;
    }

    // Marcar como pagado
    await Credito.findByIdAndUpdate(credito._id, {
      estado: 'pagado',
      fecha_pago_real: new Date()
    });

    await telegramService.responder(chatId,
      `✅ <b>Pago registrado</b>\n\n` +
      `👤 Cliente: ${cliente.nombre}\n` +
      `💰 Monto: $${credito.monto_por_pagar?.toLocaleString('es-CO')}\n` +
      `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}`
    );

  } catch (error) {
    console.error('❌ Error procesando pago:', error.message);
    await telegramService.responder(chatId,
      '❌ Error al registrar el pago. Intenta de nuevo.'
    );
  }
};

// ============================================
// COMANDO /cliente
// Muestra datos de un cliente
// Uso: /cliente 1234567890
// ============================================
const mostrarCliente = async (chatId, tenantId, cedulaCliente) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Cliente = getClienteModel(connection);
    const Credito = getCreditoModel(connection);

    const cliente = await Cliente.findOne({ cedula: cedulaCliente.trim() });
    if (!cliente) {
      await telegramService.responder(chatId,
        `❌ No encontré ningún cliente con cédula <b>${cedulaCliente}</b>`
      );
      return;
    }

    // Contar créditos
    const totalCreditos = await Credito.countDocuments({
      cliente_id: cliente._id
    });
    const creditosPendientes = await Credito.countDocuments({
      cliente_id: cliente._id,
      estado: 'pendiente'
    });

    const mensaje =
      `👤 <b>Datos del Cliente</b>\n\n` +
      `📛 <b>Nombre:</b> ${cliente.nombre}\n` +
      `🆔 <b>Cédula:</b> ${cliente.cedula}\n` +
      `📞 <b>Celular:</b> ${cliente.celular}\n` +
      `📍 <b>Dirección:</b> ${cliente.direccion || 'No registrada'}\n` +
      `💳 <b>Créditos totales:</b> ${totalCreditos}\n` +
      `⏳ <b>Pendientes:</b> ${creditosPendientes}`;

    await telegramService.responder(chatId, mensaje);

  } catch (error) {
    console.error('❌ Error mostrando cliente:', error.message);
    await telegramService.responder(chatId,
      '❌ Error al obtener los datos. Intenta de nuevo.'
    );
  }
};

// ============================================
// PROCESADOR PRINCIPAL DE MENSAJES
// Recibe el update de Telegram y lo enruta
// ============================================
exports.procesarMensaje = async (req, res) => {
  // Responder a Telegram inmediatamente — evita reintentos
  res.sendStatus(200);

  try {
    const update = req.body;

    // Ignorar updates sin mensaje
    if (!update.message && !update.callback_query) return;

    const mensaje = update.message;
    if (!mensaje) return;

    const chatId = String(mensaje.chat.id);
    const texto = mensaje.text?.trim() || '';
    const sesion = getSesion(chatId);

    console.log(`📨 Mensaje de ${chatId}: "${texto}" | Paso: ${sesion.paso}`);

    // ============================================
    // COMANDO /start — inicia vinculación
    // ============================================
    if (texto === '/start') {
      sesiones[chatId] = { paso: PASOS.ESPERANDO_EMPRESA };
      await telegramService.responder(chatId,
        '👋 <b>Bienvenido a Credirobo Bot</b>\n\n' +
        '¿A qué empresa perteneces?\n' +
        'Escribe el <b>ID de tu empresa</b> (ej: <code>empresa1</code>)'
      );
      return;
    }

    // ============================================
    // COMANDO /ayuda
    // ============================================
    if (texto === '/ayuda') {
      await mostrarAyuda(chatId);
      return;
    }

    // ============================================
    // FLUJO DE VINCULACIÓN
    // ============================================
    if (sesion.paso === PASOS.ESPERANDO_EMPRESA) {
      // Verificar que la empresa existe y está activa
      const empresa = await verificarEmpresa(texto);
      if (!empresa) {
        await telegramService.responder(chatId,
          `❌ No encontré la empresa <b>"${texto}"</b>\n\n` +
          'Verifica el ID con tu administrador e intenta de nuevo.'
        );
        return;
      }

      // Guardar empresa y pedir cédula
      sesiones[chatId] = {
        paso: PASOS.ESPERANDO_CEDULA,
        tenantId: texto.toLowerCase().trim()
      };

      await telegramService.responder(chatId,
        `✅ Empresa <b>${empresa.nombre}</b> encontrada.\n\n` +
        '¿Cuál es tu número de cédula?'
      );
      return;
    }

    if (sesion.paso === PASOS.ESPERANDO_CEDULA) {
      const cedula = texto.trim();
      const tenantId = sesion.tenantId;

      // Buscar el cobrador
      const cobrador = await buscarCobrador(tenantId, cedula);
      if (!cobrador) {
        await telegramService.responder(chatId,
          `❌ No encontré ningún cobrador con cédula <b>${cedula}</b>\n\n` +
          'Verifica tu cédula o contacta a tu administrador.'
        );
        return;
      }

      // Vincular el cobrador con este chat
      await vincularCobrador(tenantId, cedula, chatId);

      // Actualizar sesión como vinculado
      sesiones[chatId] = {
        paso: PASOS.VINCULADO,
        tenantId,
        cobradorId: String(cobrador._id),
        nombre: cobrador.nombre
      };

      await telegramService.responder(chatId,
        `🎉 <b>¡Vinculado exitosamente!</b>\n\n` +
        `Bienvenido, <b>${cobrador.nombre}</b>\n\n` +
        'Usa /ayuda para ver los comandos disponibles.'
      );
      return;
    }

    // ============================================
    // COMANDOS — requieren estar vinculado
    // ============================================
    if (sesion.paso !== PASOS.VINCULADO) {
      await telegramService.responder(chatId,
        '⚠️ Primero debes vincular tu cuenta.\nEscribe /start para comenzar.'
      );
      return;
    }

    const { tenantId, cobradorId } = sesion;

    // /pendientes
    if (texto === '/pendientes') {
      await mostrarPendientes(chatId, tenantId, cobradorId);
      return;
    }

    // /pagar [cédula]
    if (texto.startsWith('/pagar')) {
      const partes = texto.split(' ');
      if (partes.length < 2) {
        await telegramService.responder(chatId,
          '⚠️ Uso correcto:\n<code>/pagar [cédula del cliente]</code>\n\nEjemplo:\n<code>/pagar 1234567890</code>'
        );
        return;
      }
      await procesarPago(chatId, tenantId, partes[1]);
      return;
    }

    // /cliente [cédula]
    if (texto.startsWith('/cliente')) {
      const partes = texto.split(' ');
      if (partes.length < 2) {
        await telegramService.responder(chatId,
          '⚠️ Uso correcto:\n<code>/cliente [cédula del cliente]</code>\n\nEjemplo:\n<code>/cliente 1234567890</code>'
        );
        return;
      }
      await mostrarCliente(chatId, tenantId, partes[1]);
      return;
    }

    // Mensaje no reconocido
    await telegramService.responder(chatId,
      '🤔 No entendí ese comando.\nUsa /ayuda para ver los comandos disponibles.'
    );

  } catch (error) {
    console.error('❌ Error procesando mensaje de Telegram:', error);
  }
};