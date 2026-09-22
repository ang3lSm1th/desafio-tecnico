# 🗺️ Roadmap del Proyecto

## Fases de Desarrollo

### Fase 0 — Fundación ⚙️
> Setup del proyecto, base de datos y estructura base

- [ ] Crear base de datos `prueba_tecnica` en MySQL (puerto 3307)
- [ ] Crear tablas `categoria` y `producto` con seeds iniciales
- [ ] Inicializar proyecto NestJS (backend)
- [ ] Inicializar proyecto Angular 22 (frontend)
- [ ] Configurar TypeORM con MySQL en NestJS
- [ ] Verificar conexión BD

### Fase 1 — Backend: Dry Run (Phase 1) 📋
> Parsing, validación y preview sin tocar la BD

- [ ] Crear módulo `upload` en NestJS
- [ ] Implementar endpoint `POST /api/upload` (recepción de archivo)
- [ ] Integrar SheetJS para lectura del Excel
- [ ] Implementar servicio de validación por fila
- [ ] Implementar lógica de búsqueda de categoría por nombre
- [ ] Implementar lógica de detección SKU existente (INSERT vs UPDATE)
- [ ] Retornar respuesta de preview (Dry Run result)

### Fase 2 — Backend: Commit (Phase 2) 🔒
> Ejecución atómica con Unit of Work

- [ ] Implementar endpoint `POST /api/upload/commit`
- [ ] Implementar Unit of Work con transacción MySQL
- [ ] Ejecutar INSERTs y UPDATEs dentro de la transacción
- [ ] Manejar ROLLBACK en caso de error
- [ ] Retornar resultado detallado del commit

### Fase 3 — Frontend: State Machine UI 🖥️
> Interfaz de usuario con máquina de estados reactiva

- [ ] Crear componente de upload con drag & drop
- [ ] Implementar servicio HTTP para comunicación con backend
- [ ] Implementar máquina de estados (IDLE → UPLOADING → PREVIEW → COMMITTING → RESULT)
- [ ] Crear vista de preview con tabla de cambios planificados
- [ ] Implementar doble confirmación antes del commit
- [ ] Crear vista de resultados finales

### Fase 4 — Integración y Pulido 🧪
> Testing end-to-end y refinamiento

- [ ] Test de integración completo (upload → preview → commit)
- [ ] Manejo de errores edge cases (archivo vacío, formato incorrecto, etc.)
- [ ] UI/UX polish
- [ ] Documentación final
