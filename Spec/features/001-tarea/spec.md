# Feature 001 — Carga Masiva de Inventario desde Excel

## Descripción
Como usuario del sistema, quiero poder cargar un archivo Excel (`.xlsx`) con datos de inventario, previsualizar los cambios que se aplicarán (productos nuevos a insertar y stocks a actualizar), y confirmar la ejecución para que todos los cambios se apliquen de forma atómica a la base de datos.

---

## Modelo de Datos

### Tabla `categoria`

| Campo | Columna BD | Tipo | Regla de Negocio |
|-------|-----------|------|-------------------|
| id | Id_categoria | VARCHAR | PK, Requerido |
| Nombre categoría | nombre_categoria | VARCHAR | Requerido, **Debe ser único**. Si no existe, devolver error |
| activo | activo | INT | Opcional, por defecto `ACTIVO` (1) |

### Tabla `producto`

| Campo Excel | Columna BD | Tipo | Regla de Negocio |
|-------------|-----------|------|-------------------|
| Nombre Producto | nombre | VARCHAR | Requerido |
| SKU | sku | VARCHAR | Requerido, **Debe ser único**. Si no existe → INSERT nuevo producto. Si existe → UPDATE stock |
| Categoría | id_categoria | INT | FK → `categoria`. Buscar categoría por nombre. Si no existe → error en esa fila |
| Cantidad | stock | INT | Requerido, debe ser un número positivo |
| Color | color | VARCHAR | Requerido |
| Talla | talla | VARCHAR | Opcional |
| Modelo | modelo | VARCHAR | Requerido |
| Activo | estado | BOOLEAN | Opcional, por defecto `ACTIVO` (true) |

---

## Flujo Funcional

### 1. Dry Run (Preview)
```
Usuario sube .xlsx  →  Backend parsea  →  Validación por fila  →  Respuesta Preview
```

**Endpoint:** `POST /api/upload`
**Input:** Archivo `.xlsx` (multipart/form-data)
**Output:**
```json
{
  "success": true,
  "summary": {
    "total": 50,
    "toInsert": 30,
    "toUpdate": 18,
    "errors": 2
  },
  "details": [
    {
      "row": 1,
      "sku": "SKU-001",
      "action": "INSERT",
      "status": "valid",
      "data": { "nombre": "...", "stock": 10, ... }
    },
    {
      "row": 2,
      "sku": "SKU-002",
      "action": "UPDATE",
      "status": "valid",
      "changes": { "stock": { "old": 5, "new": 15 } }
    },
    {
      "row": 3,
      "sku": "SKU-003",
      "action": "ERROR",
      "status": "invalid",
      "errors": ["Categoría 'Inexistente' no encontrada"]
    }
  ],
  "previewToken": "uuid-v4-token"
}
```

### 2. Commit (Ejecución)
```
Usuario confirma  →  Backend ejecuta transacción  →  Resultado final
```

**Endpoint:** `POST /api/upload/commit`
**Input:**
```json
{
  "previewToken": "uuid-v4-token"
}
```
**Output:**
```json
{
  "success": true,
  "summary": {
    "inserted": 30,
    "updated": 18,
    "failed": 0
  },
  "message": "Inventario actualizado correctamente"
}
```

---

## Reglas de Negocio

1. **SKU único:** Si el SKU del Excel ya existe en la BD → se actualiza el `stock`. Si no existe → se inserta como nuevo producto.
2. **Categoría obligatoria:** Se busca la categoría por `nombre_categoria`. Si no se encuentra, la fila se marca como error y NO se procesa.
3. **Validación estricta:** Campos requeridos (`nombre`, `sku`, `stock`, `color`, `modelo`) deben estar presentes y válidos.
4. **Stock positivo:** El campo `stock` (Cantidad) debe ser un entero positivo.
5. **Atomicidad:** El commit ejecuta TODAS las operaciones válidas en una sola transacción. Si cualquier operación falla → ROLLBACK total.
6. **Estado por defecto:** Si el campo `Activo` no se provee, se asume `true` (ACTIVO).

---

## Criterios de Aceptación

- [ ] El usuario puede subir un archivo `.xlsx` desde la interfaz
- [ ] El sistema muestra un preview con el detalle de cada fila (INSERT/UPDATE/ERROR)
- [ ] El usuario debe confirmar explícitamente antes de que se apliquen los cambios
- [ ] Las filas con errores de validación se muestran claramente pero no bloquean las filas válidas en el preview
- [ ] El commit es atómico: todo se aplica o nada se aplica
- [ ] Si el commit falla, se muestra un mensaje de error descriptivo
- [ ] Si el commit es exitoso, se muestra un resumen con conteo de inserciones y actualizaciones
