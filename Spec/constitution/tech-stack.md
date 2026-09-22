# 🛠️ Stack Tecnológico

## Capas del Sistema

### Backend
| Tecnología | Versión / Detalle |
|---|---|
| **Runtime** | Node.js (LTS) |
| **Framework** | NestJS |
| **ORM** | TypeORM |
| **Lectura Excel** | `xlsx` (SheetJS) |
| **Validación** | `class-validator` + `class-transformer` |
| **Patrón Arquitectónico** | Two-Phase "Dry Run" + Unit of Work |

### Frontend
| Tecnología | Versión / Detalle |
|---|---|
| **Framework** | Angular 22 |
| **Lenguaje** | TypeScript |
| **HTTP Client** | `HttpClient` (Angular built-in) |
| **Patrón Arquitectónico** | State-Machine Driven Preview & Commit (Máquina de Estados Finita Reactiva con Doble Confirmación) |
| **Estilo** | CSS / Angular Material (opcional) |

### Base de Datos
| Tecnología | Detalle |
|---|---|
| **Motor** | MySQL 8+ (MySQL Workbench) |
| **Puerto** | 3307 |
| **Nombre BD** | `prueba_tecnica` |
| **Tablas** | `producto`, `categoria` |

---

## Patrones Arquitectónicos

### Backend: Two-Phase "Dry Run" + Unit of Work

```
┌─────────────────────────────────────────────────┐
│              PHASE 1: DRY RUN                   │
│                                                 │
│  1. Recibir archivo Excel                       │
│  2. Parsear filas con SheetJS                   │
│  3. Validar cada fila (campos requeridos,       │
│     tipos, reglas de negocio)                   │
│  4. Buscar categoría por nombre                 │
│  5. Verificar si SKU existe (INSERT vs UPDATE)  │
│  6. Retornar preview: lista de operaciones      │
│     planificadas SIN tocar la BD                │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              PHASE 2: COMMIT                    │
│                                                 │
│  1. Recibir confirmación del frontend           │
│  2. Abrir transacción MySQL (BEGIN)             │
│  3. Ejecutar todas las operaciones              │
│     (INSERT / UPDATE) dentro de la transacción  │
│  4. Si todo OK → COMMIT                        │
│  5. Si algún error → ROLLBACK                  │
│  6. Retornar resultado final                    │
└─────────────────────────────────────────────────┘
```

### Frontend: State-Machine Driven Preview & Commit

```
  ┌──────────┐    upload     ┌───────────┐   success   ┌───────────┐
  │   IDLE   │──────────────▶│ UPLOADING │────────────▶│  PREVIEW  │
  └──────────┘               └───────────┘             └───────────┘
       ▲                          │                     │         │
       │                        error                confirm   cancel
       │                          │                     │         │
       │                          ▼                     ▼         │
       │                    ┌───────────┐         ┌───────────┐   │
       │                    │   ERROR   │         │ COMMITTING│   │
       │                    └───────────┘         └───────────┘   │
       │                          │                  │      │     │
       │                        retry              done   error   │
       │                          │                  │      │     │
       │◀─────────────────────────┘                  ▼      ▼     │
       │                                       ┌──────────┐       │
       └───────────────────────────────────────│  RESULT  │◀──────┘
                                               └──────────┘
```

**Estados:**
- `IDLE` — Esperando que el usuario seleccione un archivo
- `UPLOADING` — Enviando archivo al backend (Dry Run)
- `PREVIEW` — Mostrando vista previa de cambios planificados
- `COMMITTING` — Ejecutando commit atómico en backend
- `RESULT` — Mostrando resultado final (éxitos y errores)
- `ERROR` — Error en la carga o el commit
