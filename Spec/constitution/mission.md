# 🎯 Misión del Proyecto

## Nombre del Proyecto
**Sistema de Carga Masiva de Inventario — Desafío Técnico**

## Declaración de Misión
Construir un sistema web full-stack que permita a un usuario cargar un archivo de inventario en formato Excel (`.xlsx`), previsualizar los cambios que se aplicarán a la base de datos (Dry Run), y confirmar la ejecución atómica (Commit) para insertar nuevos productos o actualizar el stock de productos existentes, garantizando la integridad transaccional en todo momento.

## Objetivos Clave

| # | Objetivo | Criterio de Éxito |
|---|----------|-------------------|
| 1 | Carga de archivo `.xlsx` desde el frontend | El usuario puede seleccionar y enviar un archivo Excel al backend |
| 2 | Validación y preview (Dry Run) | El sistema muestra una vista previa de los cambios (inserciones/actualizaciones) antes de aplicarlos |
| 3 | Commit atómico con Unit of Work | Todas las operaciones se ejecutan dentro de una transacción; si una falla, ninguna se aplica |
| 4 | Resolución de categorías | El sistema busca la categoría por nombre; si no existe, reporta error en esa fila |
| 5 | Upsert inteligente por SKU | Si el SKU existe → actualiza stock. Si no existe → inserta nuevo producto |
| 6 | Feedback detallado al usuario | El frontend muestra resultados fila por fila: éxito, error, nuevo, actualizado |

## Restricciones
- La base de datos **no existe** y debe ser creada como parte del proyecto
- Puerto de MySQL: **3307**
- Base de datos: **prueba_tecnica**
- El archivo Excel debe procesarse completamente en el servidor (no streaming parcial)
