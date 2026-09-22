# Tareas — Feature 001: Carga Masiva de Inventario

## Fase 0: Fundación

### Base de Datos
- [ ] Crear script SQL para la base de datos `prueba_tecnica` (puerto 3307)
- [ ] Crear tabla `categoria` (Id_categoria VARCHAR PK, nombre_categoria VARCHAR UNIQUE, activo INT DEFAULT 1)
- [ ] Crear tabla `producto` (id INT AUTO_INCREMENT PK, nombre VARCHAR, sku VARCHAR UNIQUE, id_categoria INT FK, stock INT, color VARCHAR, talla VARCHAR NULL, modelo VARCHAR, estado BOOLEAN DEFAULT TRUE)
- [ ] Crear script de seed con categorías de ejemplo

### Backend — Setup
- [ ] Inicializar proyecto NestJS (`nest new backend`)
- [ ] Instalar dependencias: `@nestjs/typeorm`, `typeorm`, `mysql2`, `xlsx`, `multer`, `@nestjs/platform-express`, `class-validator`, `class-transformer`, `uuid`
- [ ] Configurar `TypeOrmModule.forRoot()` con conexión a `prueba_tecnica` en puerto 3307
- [ ] Crear entidad `Categoria` (TypeORM)
- [ ] Crear entidad `Producto` (TypeORM)
- [ ] Verificar que NestJS inicia y se conecta a MySQL

### Frontend — Setup
- [ ] Inicializar proyecto Angular 22 (`ng new frontend`)
- [ ] Configurar `provideHttpClient()` en `app.config.ts`
- [ ] Configurar proxy de desarrollo hacia `http://localhost:3000`

---

## Fase 1: Backend — Dry Run

### Controller
- [ ] Crear `UploadModule` con declaración del controller y service
- [ ] Crear `UploadController` con endpoint `POST /api/upload`
- [ ] Configurar `FileInterceptor('file')` de `@nestjs/platform-express` para recibir el archivo
- [ ] Validar que el archivo sea `.xlsx` antes de procesar

### Service — Parsing
- [ ] Implementar `parseExcel(buffer: Buffer): ExcelRow[]` usando `xlsx`
- [ ] Definir interface `ExcelRow` con todos los campos del Excel
- [ ] Mapear headers del Excel a campos de la entidad

### Service — Validación (Dry Run)
- [ ] Implementar `dryRun(rows: ExcelRow[]): Promise<DryRunResponse>`
- [ ] Validar campos requeridos por fila
- [ ] Validar que `stock` sea entero positivo
- [ ] Buscar categoría por nombre (`categoriaRepository.findOne({ where: { nombre_categoria } })`)
- [ ] Si categoría no existe → marcar fila como ERROR
- [ ] Buscar producto por SKU (`productoRepository.findOne({ where: { sku } })`)
- [ ] Si SKU existe → marcar como UPDATE (mostrar stock viejo vs nuevo)
- [ ] Si SKU no existe → marcar como INSERT
- [ ] Generar `previewToken` (UUID v4) y guardar resultado en cache (Map<string, PreviewData>)
- [ ] Retornar `DryRunResponse` con resumen, detalles y token

### DTOs e Interfaces
- [ ] Crear `DryRunResponseDto` (summary, details, previewToken)
- [ ] Crear `PreviewRowInterface` (row, sku, action, status, data/changes/errors)
- [ ] Crear `ExcelRowInterface` (nombre, sku, categoria, cantidad, color, talla, modelo, activo)

---

## Fase 2: Backend — Commit

### Controller
- [ ] Agregar endpoint `POST /api/upload/commit` en `UploadController`
- [ ] Recibir `CommitRequestDto` con `previewToken`
- [ ] Validar que el token exista en el cache

### Service — Unit of Work
- [ ] Implementar `commit(token: string): Promise<CommitResponse>`
- [ ] Recuperar datos del preview desde el cache
- [ ] Obtener `QueryRunner` de `DataSource` (TypeORM)
- [ ] Iniciar transacción: `queryRunner.startTransaction()`
- [ ] Iterar sobre operaciones válidas:
  - [ ] INSERT → `queryRunner.manager.save(Producto, nuevaEntidad)`
  - [ ] UPDATE → `queryRunner.manager.update(Producto, { sku }, { stock: nuevoStock })`
- [ ] Si todo OK → `queryRunner.commitTransaction()`
- [ ] Si error → `queryRunner.rollbackTransaction()`
- [ ] Siempre → `queryRunner.release()` y eliminar del cache
- [ ] Retornar `CommitResponse` con conteo de insertados/actualizados/fallidos

### DTOs
- [ ] Crear `CommitRequestDto` (previewToken: string)
- [ ] Crear `CommitResponseDto` (success, summary, message)

---

## Fase 3: Frontend — State Machine UI

### Máquina de Estados
- [ ] Definir enum `UploadState` (IDLE, UPLOADING, PREVIEW, COMMITTING, RESULT, ERROR)
- [ ] Implementar `UploadStateMachine` como servicio con `BehaviorSubject<UploadState>`
- [ ] Definir transiciones válidas entre estados
- [ ] Exponer `state$` observable para el componente

### Modelos
- [ ] Crear interface `DryRunResponse` (mirror del backend)
- [ ] Crear interface `CommitResponse` (mirror del backend)
- [ ] Crear interface `PreviewRow` con campos para la tabla

### Servicio HTTP
- [ ] Crear `UploadService` con `HttpClient`
- [ ] Método `uploadFile(file: File): Observable<DryRunResponse>`
- [ ] Método `commitUpload(token: string): Observable<CommitResponse>`

### Componente Upload
- [ ] Crear componente `UploadComponent`
- [ ] Implementar zona de drag & drop para seleccionar archivo `.xlsx`
- [ ] Mostrar progreso de carga durante estado UPLOADING
- [ ] Mostrar tabla de preview en estado PREVIEW con columnas:
  - Fila | SKU | Nombre | Categoría | Acción (INSERT/UPDATE) | Estado (valid/invalid) | Detalle
- [ ] Botón "Confirmar y Ejecutar" → diálogo de doble confirmación
- [ ] Mostrar resumen de resultados en estado RESULT
- [ ] Mostrar errores con opción de reintentar en estado ERROR
- [ ] Botón "Cargar otro archivo" para volver a IDLE

---

## Fase 4: Integración y Pulido

- [ ] Test end-to-end: subir archivo → ver preview → confirmar → ver resultado
- [ ] Probar con archivo vacío
- [ ] Probar con archivo con todas las filas con errores
- [ ] Probar con archivo mixto (algunas válidas, algunas con error)
- [ ] Probar con SKUs duplicados dentro del mismo archivo
- [ ] Probar con categorías inexistentes
- [ ] Verificar ROLLBACK: forzar un error mid-transaction y validar que nada se persiste
- [ ] UI/UX: indicadores de carga, colores por estado, iconos
- [ ] CORS: configurar en NestJS para producción
