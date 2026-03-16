# 💰 CrediAgil — Backend API

> **API REST multitenant para gestión de créditos informales**
> *Multitenant REST API for informal credit management*

![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

---

## 📋 Tabla de contenidos / Table of Contents

- [Descripción general](#-descripción-general)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura de archivos](#-estructura-de-archivos)
- [Instalación local](#-instalación-y-configuración-local)
- [Variables de entorno](#-variables-de-entorno)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Sistema multitenant](#-sistema-multitenant)
- [Panel superadmin](#-panel-superadmin)
- [Despliegue en Vercel](#-despliegue-en-vercel)

---

## 📌 Descripción general

**ES:** Backend de CrediAgil — una API REST construida con Node.js y Express que implementa arquitectura **multitenant**. Cada empresa conectada al sistema obtiene su propia base de datos aislada en MongoDB Atlas. Incluye endpoints para gestionar clientes, cobradores y créditos, además de un módulo de administración protegido para el superadmin.

**EN:** CrediAgil Backend — a REST API built with Node.js and Express implementing a **multitenant** architecture. Each connected company gets its own isolated MongoDB Atlas database. Includes endpoints for managing clients, collectors and credits, plus a protected admin module for the superadmin.

### Funcionalidades principales / Main Features

- ✅ Arquitectura multitenant — BD separada por empresa
- ✅ Lógica de negocio centralizada (comisiones, plazos, validaciones)
- ✅ Panel de superadmin con estadísticas globales
- ✅ CORS configurado para producción en Vercel
- ✅ Reconexión automática a MongoDB en entorno serverless

---

## 🛠 Stack tecnológico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 22.x | Runtime |
| Express | 5.x | Framework HTTP |
| Mongoose | 8.x | ODM para MongoDB |
| MongoDB Atlas | Cloud | Base de datos |
| dotenv | 17.x | Variables de entorno |
| cors | 2.x | Política de origen cruzado |
| Vercel | — | Despliegue serverless |

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                  PETICIÓN ENTRANTE                  │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │    CORS Middleware   │
        │  valida el origen   │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │  ¿Es ruta /api/admin/*?              │
        │                                      │
        │  SÍ → adminMiddleware               │
        │        verifica X-Admin-Secret       │
        │        conecta a admin_db            │
        │                                      │
        │  NO → tenantMiddleware              │
        │        extrae X-Tenant-ID            │
        │        → databaseMiddleware          │
        │           conecta a {tenant}_db      │
        └──────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │    CONTROLADOR      │
        │  usa req.db para    │
        │  operar en la BD    │
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  MONGODB ATLAS                      │
│                                                     │
│  admin_db        → empresas registradas             │
│  empresa1_db     → clientes, cobradores, créditos   │
│  empresa2_db     → clientes, cobradores, créditos   │
│  {tenantId}_db   → datos completamente aislados     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de archivos

```
creditos-api/
├── api/
│   └── index.js                  # Entry point para Vercel serverless
├── src/
│   ├── app.js                    # Express app, CORS, registro de rutas
│   ├── server.js                 # Entry point para ejecución local
│   ├── config/
│   │   └── database.js           # getTenantConnection + getAdminConnection
│   ├── controllers/
│   │   ├── admin.controller.js   # CRUD empresas + estadísticas globales
│   │   ├── cliente.controller.js
│   │   ├── cobrador.controller.js
│   │   └── credito.controller.js
│   ├── middlewares/
│   │   ├── admin.middleware.js   # Verifica X-Admin-Secret
│   │   ├── database.middleware.js# Inyecta req.db según el tenant
│   │   ├── tenant.middleware.js  # Extrae X-Tenant-ID del header
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── empresa.model.js      # Modelo de empresa (admin_db)
│   │   ├── cliente.model.js
│   │   ├── cobrador.model.js
│   │   └── credito.model.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── cliente.routes.js
│   │   ├── cobrador.routes.js
│   │   └── credito.routes.js
│   └── services/
│       ├── cliente.service.js
│       ├── cobrador.service.js
│       └── credito.service.js
├── .env                          # Variables de entorno (no subir a git)
├── vercel.json                   # Configuración de despliegue
└── package.json
```

---

## 🚀 Instalación y configuración local

### Requisitos previos

- Node.js v22+
- Cuenta en MongoDB Atlas
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/dgamay/creditos-api.git
cd creditos-api
npm install
```

### 2. Configurar variables de entorno

Crea el archivo `.env` en la raíz del proyecto:

```properties
PORT=3000
MONGO_URI=mongodb+srv://dgm2:12345@cluster0.lfrf5p5.mongodb.net
ADMIN_SECRET=tu_clave_superadmin
```

### 3. Iniciar el servidor

```bash
npm start
```

El servidor queda disponible en `http://localhost:3000`

---

## 🔐 Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor local | `3000` |
| `MONGO_URI` | URI de MongoDB Atlas **sin** nombre de BD al final | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `ADMIN_SECRET` | Clave del superadmin | `superadmin123` |

> ⚠️ **Importante:** La `MONGO_URI` NO debe incluir el nombre de la base de datos al final. El sistema construye el nombre dinámicamente como `{tenantId}_db` para cada empresa y `admin_db` para el panel de administración.

---

## 📡 Endpoints de la API

### Headers requeridos

| Grupo de endpoints | Header requerido |
|--------------------|-----------------|
| `/api/clientes/*` | `X-Tenant-ID: {tenantId}` |
| `/api/cobradores/*` | `X-Tenant-ID: {tenantId}` |
| `/api/creditos/*` | `X-Tenant-ID: {tenantId}` |
| `/api/admin/*` | `X-Admin-Secret: {secret}` |

---

### 👤 Cobradores — `/api/cobradores`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/cobradores` | Listar todos los cobradores |
| `POST` | `/api/cobradores` | Crear nuevo cobrador |
| `PUT` | `/api/cobradores/:id` | Actualizar cobrador |
| `DELETE` | `/api/cobradores/:id` | Eliminar cobrador |

**Ejemplo POST — Body:**
```json
{
  "nombre": "Ana Martínez",
  "cedula": "1112223334",
  "direccion": "Cra 45 # 10-20, Medellín",
  "celular": "3209876543"
}
```

---

### 🧑 Clientes — `/api/clientes`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/clientes` | Listar todos los clientes |
| `GET` | `/api/clientes?cobrador_id={id}` | Filtrar por cobrador |
| `POST` | `/api/clientes` | Crear nuevo cliente |
| `PUT` | `/api/clientes/:id` | Actualizar cliente |
| `DELETE` | `/api/clientes/:id` | Eliminar cliente |

**Ejemplo POST — Body:**
```json
{
  "nombre": "Pedro Suárez",
  "cedula": "3334445556",
  "direccion": "Cra 70 # 45-10, Medellín",
  "celular": "3177778888",
  "cobrador_id": "69b72fdf4e93854d118fee8d"
}
```

---

### 💳 Créditos — `/api/creditos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/creditos` | Crear nuevo crédito |
| `GET` | `/api/creditos/cliente?cliente_id={id}` | Créditos por cliente |
| `GET` | `/api/creditos/cobrador?cobrador_id={id}` | Pendientes por cobrador |

**Ejemplo POST — Body:**
```json
{
  "cliente_id": "69b733d64e93854d118fee9a",
  "cobrador_id": "69b72fdf4e93854d118fee8d",
  "monto_prestado": 500000,
  "fecha_origen": "2026-03-15",
  "fecha_pago": "2026-03-28",
  "estado": "pendiente"
}
```

**Respuesta — valores calculados automáticamente por el backend:**
```json
{
  "monto_prestado": 500000,
  "monto_por_pagar": 650000,
  "comision_cobrador": 100000,
  "estado": "pendiente"
}
```

**Validaciones automáticas:**

| Regla | Valor |
|-------|-------|
| Monto mínimo | `$100,000 COP` |
| Plazo máximo | `15 días` desde `fecha_origen` |
| Créditos simultáneos | Máximo `1` activo por cliente |
| Comisión total | `30%` del monto prestado |
| Comisión cobrador | `20%` del monto prestado |

---

### 🔐 Admin — `/api/admin`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/verify` | Verificar acceso con el secret |
| `GET` | `/api/admin/empresas` | Listar todas las empresas |
| `POST` | `/api/admin/empresas` | Registrar nueva empresa |
| `PUT` | `/api/admin/empresas/:id/toggle` | Activar o desactivar empresa |
| `DELETE` | `/api/admin/empresas/:id` | Eliminar empresa |
| `GET` | `/api/admin/stats` | Estadísticas globales de todas las empresas |

**Ejemplo POST — Body:**
```json
{
  "tenantId": "empresa2",
  "nombre": "Empresa Dos SAS",
  "email": "admin@empresados.com",
  "notas": "Segunda empresa registrada"
}
```

**Ejemplo GET stats — Respuesta:**
```json
{
  "resumen": {
    "totalEmpresas": 2,
    "empresasActivas": 2,
    "empresasInactivas": 0
  },
  "empresas": [
    {
      "tenantId": "empresa1",
      "nombre": "Empresa Uno SAS",
      "activa": true,
      "totalClientes": 3,
      "totalCobradores": 1,
      "totalCreditos": 1,
      "creditosPendientes": 1
    }
  ]
}
```

---

## 🏢 Sistema multitenant

### ¿Cómo funciona?

1. El frontend envía el header `X-Tenant-ID: empresa1` en cada petición
2. `tenantMiddleware` extrae el valor y lo guarda en `req.tenant`
3. `databaseMiddleware` llama a `getTenantConnection('empresa1')`
4. Se crea (o reutiliza) una conexión a `empresa1_db` en MongoDB Atlas
5. La conexión queda disponible en `req.db` para todos los controladores
6. Los modelos se registran dinámicamente en esa conexión con `getClienteModel(req.db)`

### Aislamiento de datos

```
empresa1 → empresa1_db → sus propios clientes, cobradores, créditos
empresa2 → empresa2_db → sus propios clientes, cobradores, créditos
```

Los datos de una empresa **nunca** son accesibles desde otra.

### Formato del tenantId

- Solo letras, números y guiones: `empresa-uno`, `creditos2`, `mi-empresa`
- Mínimo 2 caracteres
- Se convierte automáticamente a minúsculas

### Reconexión en entorno serverless

El sistema verifica `connection.readyState === 1` antes de reutilizar una conexión. Si la conexión está caída (frecuente en Vercel serverless), la recrea automáticamente.

---

## 👑 Panel superadmin

Las rutas `/api/admin/*` están registradas **antes** del `tenantMiddleware` en `app.js`, por lo que no requieren `X-Tenant-ID`. En su lugar usan `X-Admin-Secret`.

### Seguridad

- `adminMiddleware` verifica que `req.headers['x-admin-secret'] === process.env.ADMIN_SECRET`
- Responde `401` si no se envía el header
- Responde `403` si el secret es incorrecto
- Los datos de empresas se guardan en `admin_db` — completamente separada de los tenants

---

## ☁️ Despliegue en Vercel

### 1. Conectar repositorio en Vercel

Importa el repositorio desde [vercel.com](https://vercel.com)

### 2. Configurar variables de entorno

En **Settings → Environment Variables** agrega:

| Variable | Valor |
|----------|-------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `ADMIN_SECRET` | `tu_clave_superadmin` |

### 3. Verificar `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### 4. Verificar `api/index.js`

```javascript
require('dotenv').config();
const app = require('../src/app');
module.exports = app;
```

### 5. Push y despliegue automático

```bash
git add .
git commit -m "deploy: producción"
git push
```

Vercel detecta el push y despliega automáticamente.

---

## 📊 Reglas de negocio

| Regla | Valor |
|-------|-------|
| Comisión total del crédito | 30% del monto prestado |
| Comisión para el cobrador | 20% del monto prestado |
| Plazo máximo de pago | 15 días desde fecha de origen |
| Monto mínimo de crédito | $100,000 COP |
| Créditos simultáneos por cliente | Máximo 1 activo |

---

## 👨‍💻 Autor

Desarrollado como proyecto de integración web y móvil.

**Universidad:** Unicatólica
**Materia:** Integración Web y Móvil
**Stack:** MERN (MongoDB, Express, React, Node.js)

---

*CrediAgil Backend API — 2026*
