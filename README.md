# Desafío Técnico - Carga Masiva de Productos desde Excel

Sistema web full-stack para la validación, previsualización e importación masiva de productos y categorías mediante archivos Excel (.xlsx).

## 🚀 Arquitectura del Proyecto

El repositorio está organizado en monorepositorio con las siguientes carpetas:

- **`backend/`**: API REST desarrollada con **NestJS**, TypeORM, SQLite (en memoria / persistente) y procesamiento de hojas de cálculo con `exceljs`.
  - Validación de datos (Dry-run / simulación previa).
  - Persistencia transaccional con manejo de errores y deduplicación.
  - Endpoint de seeding (`/seed`) para datos de prueba iniciales.
- **`frontend/`**: Aplicación Single Page desarrollada con **Angular 19** y Tailwind CSS.
  - Carga interactiva Drag & Drop de archivos Excel.
  - Previsualización en tiempo real con estadísticas y estados de fila (válido, duplicado, error de formato).
  - Confirmación y guardado definitivo en base de datos.
- **`Spec/`**: Especificaciones y artefactos de desarrollo / features.

---

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- `npm`

---

## ⚙️ Instalación y Ejecución

### 1. Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```
El servidor backend correrá por defecto en `http://localhost:3000`.

### 2. Frontend (Angular)

```bash
cd frontend
npm install
npm start
```
La aplicación cliente estará disponible en `http://localhost:4200`.

---

## 📋 Funcionalidades Principales

1. **Simulación (Dry-Run):** Procesa el archivo Excel sin guardar cambios en base de datos, retornando el estado de cada fila y las inconsistencias encontradas.
2. **Carga Real (Commit):** Inserta o actualiza los registros validados dentro de una transacción atómica.
3. **Resumen y Alertas:** Vista previa detallada con conteo de registros válidos, duplicados y con error.
