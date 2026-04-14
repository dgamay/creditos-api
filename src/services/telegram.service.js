// ============================================
// TELEGRAM SERVICE - BACKEND
// src/services/telegram.service.js
// Servicio central para enviar mensajes
// y gestionar el bot de Telegram
// ============================================

const TelegramBot = require('node-telegram-bot-api');

// ============================================
// INSTANCIA DEL BOT
// Se crea una sola vez y se reutiliza
// En Vercel (serverless) usamos webhook en lugar
// de polling para no tener proceso corriendo
// ============================================
let bot = null;

const getBot = () => {
  if (!bot) {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN no está configurado en .env');
    }
    // ✅ webhook: true — no inicia polling, solo envía mensajes
    bot = new TelegramBot(token, { polling: false });
    console.log('🤖 Bot de Telegram inicializado');
  }
  return bot;
};

// ============================================
// FUNCIONES DE ENVÍO
// ============================================

const telegramService = {

  // ------------------------------------------
  // ENVIAR MENSAJE DE TEXTO SIMPLE
  // @param {string} chatId - ID del chat destino
  // @param {string} mensaje - Texto a enviar
  // ------------------------------------------
  enviarMensaje: async (chatId, mensaje) => {
    try {
      const bot = getBot();
      await bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      console.log(`✅ Mensaje enviado a chat ${chatId}`);
    } catch (error) {
      console.error(`❌ Error enviando mensaje a ${chatId}:`, error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // ENVIAR MENSAJE CON BOTONES INLINE
  // @param {string} chatId
  // @param {string} mensaje
  // @param {Array} botones - Array de botones
  // ------------------------------------------
  enviarMensajeConBotones: async (chatId, mensaje, botones) => {
    try {
      const bot = getBot();
      await bot.sendMessage(chatId, mensaje, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: botones
        }
      });
      console.log(`✅ Mensaje con botones enviado a chat ${chatId}`);
    } catch (error) {
      console.error(`❌ Error enviando mensaje con botones:`, error.message);
      throw error;
    }
  },

  // ------------------------------------------
  // NOTIFICAR CRÉDITO VENCIDO AL COBRADOR
  // @param {string} chatId - Chat ID del cobrador
  // @param {Object} credito - Datos del crédito
  // @param {Object} cliente - Datos del cliente
  // ------------------------------------------
  notificarCreditoVencido: async (chatId, credito, cliente) => {
    const mensaje = `
⚠️ <b>Crédito Vencido</b>

👤 <b>Cliente:</b> ${cliente.nombre}
📞 <b>Celular:</b> ${cliente.celular}
💰 <b>Monto pendiente:</b> $${credito.monto_por_pagar?.toLocaleString('es-CO')}
📅 <b>Fecha límite:</b> ${new Date(credito.fecha_pago).toLocaleDateString('es-CO')}

Usa /pendientes para ver todos tus créditos.
    `.trim();

    await telegramService.enviarMensaje(chatId, mensaje);
  },

  // ------------------------------------------
  // NOTIFICAR NUEVO CRÉDITO ASIGNADO
  // @param {string} chatId - Chat ID del cobrador
  // @param {Object} credito - Datos del crédito
  // @param {Object} cliente - Datos del cliente
  // ------------------------------------------
  notificarNuevoCredito: async (chatId, credito, cliente) => {
    const mensaje = `
🆕 <b>Nuevo Crédito Asignado</b>

👤 <b>Cliente:</b> ${cliente.nombre}
📞 <b>Celular:</b> ${cliente.celular}
💰 <b>Monto prestado:</b> $${credito.monto_prestado?.toLocaleString('es-CO')}
💵 <b>Monto a cobrar:</b> $${credito.monto_por_pagar?.toLocaleString('es-CO')}
📅 <b>Fecha límite:</b> ${new Date(credito.fecha_pago).toLocaleDateString('es-CO')}
    `.trim();

    await telegramService.enviarMensaje(chatId, mensaje);
  },

  // ------------------------------------------
  // NOTIFICAR AL SUPERADMIN — nueva empresa
  // @param {Object} empresa - Datos de la empresa
  // ------------------------------------------
  notificarNuevaEmpresa: async (empresa) => {
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (!adminChatId) {
      console.warn('⚠️ ADMIN_CHAT_ID no configurado — omitiendo notificación');
      return;
    }

    const mensaje = `
🏢 <b>Nueva Empresa Registrada</b>

📋 <b>Nombre:</b> ${empresa.nombre}
🔑 <b>TenantID:</b> ${empresa.tenantId}
📧 <b>Email:</b> ${empresa.email}
📅 <b>Fecha:</b> ${new Date().toLocaleDateString('es-CO')}
    `.trim();

    await telegramService.enviarMensaje(adminChatId, mensaje);
  },

  // ------------------------------------------
  // RESPONDER A UN MENSAJE DEL WEBHOOK
  // Método auxiliar usado por el controlador
  // @param {string} chatId
  // @param {string} mensaje
  // ------------------------------------------
  responder: async (chatId, mensaje) => {
    await telegramService.enviarMensaje(chatId, mensaje);
  }

};

module.exports = telegramService;