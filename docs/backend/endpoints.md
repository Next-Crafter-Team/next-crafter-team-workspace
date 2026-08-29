# Documentación de backend — "Cementerio de Ideas"

> Estado: propuesta de diseño. Este documento traduce la propuesta de backend
> (endpoints REST + tablas) al backend real del proyecto, que es **Convex**, y la
> alinea con los contratos ya existentes en `openspec/specs/` y `*/CONTRACT.md`.
>
> Última revisión: 2026-08-29

---

## 1. Contexto y alcance

El sistema deja que repos de GitHub abandonados (o entradas manuales) se vuelvan
"tumbas" con autopsia, y que otros los resuciten. Auth con **Clerk** (Google por
defecto), un **GitHub App** para la integración con GitHub, y **Convex como único
backend / única persistencia**.

Este documento cubre dos superficies de gestión, que son productos distintos con
permisos distintos:

| Panel | Quién lo usa | Alcance de datos |
| --- | --- | --- |
| **Panel 1 — Mi Cementerio** | cualquier creador autenticado | solo sus propios datos (`ownerUserId == usuario actual`) |
| **Panel 2 — Admin de Plataforma** | solo rol `admin` | datos globales, moderación, salud del sistema |

No se mezclan en una vista. El Panel 2 vive detrás de `requireAdmin` y nunca
confía en el cliente para la verificación de rol.

---

## 2. Convención: "endpoint" en un backend Convex

La propuesta original está escrita como una API REST (`GET /me/ideas`,
`POST /admin/reports/:id/resolve`). Este proyecto **no expone una API REST
propia**; expone funciones Convex. La equivalencia:

| Verbo REST | Función Convex | Notas |
| --- | --- | --- |
| `GET` (lectura) | `query` | reactiva, sin efectos secundarios |
| `POST` / `PATCH` / `DELETE` (escritura simple) | `mutation` | transaccional; valida `requireUser` / `requireAdmin` |
| Acción con I/O externa (GitHub, generación de autopsia con LLM, envío) | `action` | única capa que puede llamar servicios externos |
| Webhook / redirect de terceros | `httpAction` | Clerk webhook, GitHub setup/webhook, cron interno con secreto |

En las tablas de abajo, la columna **"Ruta lógica"** conserva la nomenclatura REST
de la propuesta como *nombre de referencia* del endpoint; la columna **"Función
Convex"** es lo que realmente se implementa (`convex/<archivo>.ts` → `export`).

### Mapa de terminología

La propuesta y los specs usan palabras distintas para lo mismo:

| Propuesta de backend | Specs del repo (`openspec/specs/`) |
| --- | --- |
| "idea" | `repository` (entidad del cementerio, sea `origin: github` o `origin: manual`) |
| "autopsia" | campos `whyItDied` + `whatYouLearned` |
| "enterrar" | transición a `status: buried` |
| "resucitar" / "revivir" / "reclamar" | flujo revive → `status: revived` / `undead` |
| "lápida" / "tumba" | vista de detalle del `repository` |
| "linaje" | `lineage: LineageEntry[]` |

A lo largo del documento se usa **`repository`** como nombre canónico de la entidad.

### Estados de una idea/`repository`

La propuesta menciona `latente | recordatorio | enterrada | revivida`. El spec
`repository.md` define `status: buried | haunted | revived | undead`. Reconciliación
propuesta:

| Propuesta | `status` + condición | Significado |
| --- | --- | --- |
| latente | `buried` + `visibility: private`, sin recordatorio activo | importada/creada, aún no expuesta ni "rondada" por el cron |
| recordatorio | `haunted` | tiene 1+ recordatorios activos del cron (contador 1/3…3/3) |
| enterrada | `buried` + `visibility: public` | autopsia pública publicada |
| revivida | `revived` (o `undead` si `revivalCount > 1`) | alguien la resucitó |

> ⚠️ Introducir explícitamente "latente" como estado propio requiere un cambio de
> spec en `openspec/changes/repository-<slug>/`. Mientras tanto se modela con
> `status: buried` + `visibility` + presencia/ausencia de recordatorios.

---

## 3. Autenticación y autorización

- **Identidad**: Clerk es el único proveedor. Convex valida el JWT de Clerk vía
  `convex/auth.config.ts`. El backend **no** emite ni refresca sesiones propias.
- **Usuario de dominio**: `requireUser(ctx)` (de `packages/auth`) resuelve el JWT
  al documento `users._id` (`UserId`). Hace *lazy upsert* si el webhook
  `user.created` de Clerk todavía no llegó, sin duplicar filas.
- **Rol**: nuevo campo `users.role: "user" | "admin"` (default `"user"`). Se
  guarda en la metadata pública de Clerk y viaja en el JWT; el backend lo
  **re-verifica** en cada función admin. Nunca se confía en el front.
- **`requireAdmin(ctx)`**: helper que hace `requireUser(ctx)` y además exige
  `user.role === "admin"`; si no, lanza error y la función no ejecuta nada.
- **Cron interno**: `httpAction` protegido por un secreto de servidor
  (`CRON_SHARED_SECRET` en env de Convex), no por JWT de usuario.

| Contexto | Helper | Falla si… |
| --- | --- | --- |
| Endpoints públicos de lectura | — (opcional `getUserOrNull`) | nunca; devuelve solo campos públicos |
| Endpoints del Panel 1 | `requireUser(ctx)` | no hay sesión válida |
| Escrituras sobre un `repository` | `requireOwner(ctx, repositoryId)` | `repo.ownerUserId !== currentUser._id` |
| Endpoints del Panel 2 | `requireAdmin(ctx)` | no hay sesión / `role !== "admin"` |
| Cron | secreto compartido | header/secreto inválido |

---

## 4. Panel 1 — Mi Cementerio (endpoints del creador)

Todos exigen `requireUser`. Toda lectura y escritura filtra por
`ownerUserId == currentUser._id`, verificado server-side. El cliente nunca decide
qué puede tocar.

### 4.1 Mis ideas

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `GET /me/ideas` | `repositories.listMine` | query | Todas las ideas del usuario con `status`, `visibility`, `statusUpdatedAt`, contadores. Acepta filtros `{ status?, visibility? }` para las pestañas del panel. |
| `PATCH /ideas/:id` | `repositories.update` | mutation | Editar autopsia (`whyItDied`, `whatYouLearned`) y/o `visibility` (`public` / `private` / `public_no_code`). `requireOwner`. |
| `DELETE /ideas/:id` | `repositories.softDelete` | mutation | **Borrado lógico**: setea `deletedAt`. No borra físico, para no romper el `lineage` si ya fue resucitada. `requireOwner`. |
| `POST /ideas/:id/bury` | `repositories.bury` | action | Pasa una idea `latente`/`haunted` a `buried` + `visibility: public` y dispara la generación del borrador de autopsia (LLM). `requireOwner`. |

**`repositories.listMine` — args / respuesta**

```ts
// args
{ status?: "buried" | "haunted" | "revived" | "undead",
  visibility?: "public" | "private" | "public_no_code" }

// respuesta: Array<{
//   _id, title, origin, contentType, githubFullName?,
//   status, visibility, stack?,
//   whyItDied, whatYouLearned,            // vacíos si aún no hay autopsia
//   reactionCount, revivalCount,
//   statusUpdatedAt, githubSyncedAt,      // dos relojes, no se colapsan
//   activeReminder?: { count: 1|2|3, nextRunAt: number },
//   deletedAt: null
// }>
```

**Notas de implementación**

- Índice `repositories.by_owner_status` sobre `(ownerUserId, status)` — casi todas
  estas consultas filtran por esas dos columnas.
- `listMine` excluye `deletedAt != null` salvo que se pase `includeDeleted: true`.
- `visibility: "public_no_code"` = autopsia pública pero sin exponer contenido de
  archivos del repo (ver `repository.md`, escenario "public autopsy hides source
  code").
- `update` NUNCA inventa texto de autopsia: si el usuario limpia el campo, queda
  vacío.

### 4.2 Recordatorios

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `GET /me/reminders` | `reminders.listMine` | query | Recordatorios activos del usuario, cada uno con su contador (`1/3`, `2/3`, `3/3`) y la idea asociada. |
| `POST /reminders/:id/respond` | `reminders.respond` | mutation | Body `{ action: "keep" \| "snooze" \| "bury" }`. |

**`reminders.respond` — semántica**

| `action` | Efecto |
| --- | --- |
| `keep` | resetea el contador a 0 y reprograma lejos (`nextRunAt = now + KEEP_INTERVAL`) |
| `snooze` | reprograma cerca (`now + SNOOZE_INTERVAL`) **sin** resetear el contador |
| `bury` | transiciona la idea a `buried`, llama a la generación de autopsia, cierra el recordatorio |

El usuario **no crea** recordatorios; los crea el cron (§6). Esta es la pieza
central de "gestión vía backend": el sistema empuja el estado solo, el usuario
solo responde.

### 4.3 Guardadas y linaje

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `GET /me/saved` | `savedIdeas.listMine` | query | Ideas de otros que el usuario marcó (swipe derecha) para reclamar más tarde. |
| `GET /me/lineage` | `repositories.listMyLineage` | query | Ideas que el usuario enterró y que **otros** resucitaron: su "legado", con la traza `{ actorUserId, at, action }` por entrada. |

### 4.4 Importar de GitHub (ya existente — `packages/github`)

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| — | `github.getConnectionStatus` | query | `{ connected, installationId?, accountLogin?, scopeType }` |
| — | `github.listRepositories` | action | repos de la instalación → candidatos `origin: github` |
| `GET /github/install-url` | `github.startConnection` | action | `{ installUrl }` para el flujo de instalación del GitHub App |
| — | `github.disconnect` | action | `{ ok }` — no borra datos del cementerio |
| `GET /github/setup` | `httpAction /github/setup` | httpAction | redirect post-instalación; **verifica** que la instalación pertenece al `userId` firmado |
| `POST /github/webhook` | `httpAction /github/webhook` | httpAction | `installation.deleted`, `installation_repositories`, etc. |
| `POST /ideas/import` | `repositories.importFromCandidate` | mutation | crea un `repository` desde un candidato de GitHub (`owner = currentUser`, `githubSyncedAt = now`, autopsia vacía) |

### 4.5 Subir contenido manual (ya existente — `packages/manual-entry`)

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `POST /uploads/url` | `files.generateUploadUrl` | action | URL de subida de Convex Storage → devuelve `storageId` para evidencia |
| `POST /ideas/manual` | `repositories.createManual` | mutation | toma el form (`title`, `contentType`, `createdAtLabel?`, `whyItDied?`, `whatYouLearned?`, `evidence[]`, `visibility`) → `repository` con `origin: manual`, `githubFullName` ausente, `githubSyncedAt: null` |

`visibility` por defecto = `private`. `evidence` vacío ⇒ `artifacts: []` (nunca un
placeholder inventado).

---

## 5. Panel 2 — Admin de Plataforma (endpoints de admin)

Todos detrás de `requireAdmin(ctx)`. Visualmente el panel se diferencia (badge
`ADMIN`), pero la garantía real es server-side.

### 5.1 Dashboard de métricas

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `GET /admin/metrics` | `admin.metrics` | query | Totales globales + series de tiempo. Lee de `metrics_daily` (pre-agregado), no escanea toda la base en cada carga. |

**Respuesta**

```ts
{
  totals: {
    buried: number,
    revived: number,
    activeUsers: number,          // con actividad en los últimos N días
    resurrectionRate: number      // revived / buried, período actual
  },
  series: Array<{
    date: string,                 // YYYY-MM-DD
    buried: number,
    revived: number,
    activeUsers: number,
    resurrectionRate: number
  }>
}
```

Parámetro opcional `{ from?: string, to?: string, granularity?: "day" | "week" }`.

### 5.2 Moderación

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `POST /ideas/:id/report` | `reports.create` | mutation | **Público autenticado** (cualquier usuario logueado). Body `{ reason }`. Alimenta la cola. Idempotente por `(ideaId, reporterId)`. |
| `GET /admin/reports` | `admin.reports.list` | query | Cola de contenido reportado con contexto y `status` (`pending` / `resolved`). Filtro `{ status? }`. |
| `POST /admin/reports/:id/resolve` | `admin.reports.resolve` | mutation | Body `{ action: "approve" \| "hide" \| "delete", note? }`. |

**`admin.reports.resolve` — semántica**

| `action` | Efecto |
| --- | --- |
| `approve` | el reporte se desestima; el `repository` queda visible sin cambios |
| `hide` | `repository.visibility` forzada a `private` (u oculta de browse); autopsia deja de ser pública |
| `delete` | borrado lógico del `repository` (`deletedAt`); el `lineage` se preserva |

En todos los casos: `report.status = "resolved"`, `resolvedBy = adminUserId`,
`resolvedAt = now`, `note` guardada.

### 5.3 Estado del sistema (observabilidad)

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `GET /admin/system/health` | `admin.system.health` | query | Salud de jobs e integraciones. |

**Respuesta**

```ts
{
  cron: {
    lastRun: { startedAt, finishedAt, status: "success" | "error", errorMessage? } | null,
    recentRuns: Array<{ startedAt, status, durationMs }>   // últimas ~20
  },
  github: {
    activeInstallations: number,
    recentOAuthErrors: number      // ventana últimas 24h
  },
  api: {
    recentErrorCount: number,
    p95LatencyMs: number | null    // si se instrumenta
  }
}
```

Lee de la tabla `job_runs` (el cron escribe una fila por corrida) y de
`github_installations` (`status: active`).

### 5.4 Gestión de usuarios

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `GET /admin/users` | `admin.users.list` | query | Lista de usuarios con `role`, `status`, contadores (ideas, revividas), última actividad. Paginada. |
| `PATCH /admin/users/:id` | `admin.users.update` | mutation | Body `{ role?: "user" \| "admin", status?: "active" \| "suspended" }`. Un admin no puede auto-degradarse si es el último admin. |

Cambiar `role` también actualiza la metadata pública en Clerk (vía `action`) para
que el JWT del usuario refleje el nuevo rol en su próxima renovación.

---

## 6. Jobs internos (cron)

| Ruta lógica | Función Convex | Tipo | Descripción |
| --- | --- | --- | --- |
| `POST /internal/cron/process-reminders` | `httpAction /internal/cron/process-reminders` | httpAction | Protegida por `CRON_SHARED_SECRET`. Escanea repos privados inactivos, incrementa contadores de recordatorio, crea/actualiza filas en `reminders`, y transiciona a `haunted`. |

Se dispara con `convex/crons.ts` (`crons.interval` / `crons.cron`). En cada
corrida:

1. Escribe una fila en `job_runs` con `startedAt`, `jobName: "process-reminders"`.
2. Busca `repositories` con `origin: github`, `visibility: private`,
   `status in (buried, haunted)` cuyo `githubSyncedAt`/`lastPushAt` supera el
   umbral de inactividad.
3. Por cada uno: `reminder.count += 1` (máx 3), `nextRunAt` reprogramado,
   `repository.status = "haunted"`.
4. Al terminar: actualiza la fila de `job_runs` con `finishedAt` y
   `status: "success" | "error"` (+ `errorMessage` si falló).

> El usuario nunca llama este endpoint. El panel admin **lee** de `job_runs` para
> "Estado del sistema".

---

## 7. Endpoints públicos / compartidos

No pertenecen a ningún panel; los consume la app principal (browse + detalle +
interacción). Lectura sin sesión permitida; escritura exige `requireUser`.

| Ruta lógica | Función Convex | Tipo | Auth | Descripción |
| --- | --- | --- | --- | --- |
| `GET /ideas` | `repositories.browsePublic` | query | público | listado público paginado, filtros `stack?`, `contentType?`, orden por `statusUpdatedAt` / `reactionCount` |
| `GET /ideas/:id` | `repositories.getPublicDetail` | query | público | detalle; devuelve autopsia solo si `visibility` lo permite; **nunca** contenido de archivos |
| `POST /ideas/:id/revive` | `repositories.revive` | mutation | `requireUser` | `status → revived`/`undead`, `revivalCount++`, append a `lineage`, notifica al owner previo |
| `POST /ideas/:id/reactions` | `reactions.toggle` | mutation | `requireUser` | `kind: rip \| tried_too \| should_exist`, toggle independiente por kind |
| `GET /ideas/:id/reactions` | `reactions.listForRepository` | query | público | `[{ kind, count }]` |
| `POST /ideas/:id/save` | `savedIdeas.toggle` | mutation | `requireUser` | swipe derecha: marcar/desmarcar para reclamar |
| `GET /me/notifications` | `notifications.listForUser` | query | `requireUser` | `[{ id, kind, repositoryId, actorUserId, read, createdAt }]` |
| `POST /notifications/:id/read` | `notifications.markRead` | mutation | `requireUser` | marca una sola notificación (`read` es por-notificación, no global) |
| `POST /clerk/webhook` | `httpAction /clerk/webhook` | httpAction | firma Clerk | `user.created` / `user.updated` / `user.deleted` → upsert/anonimiza `users` |

`repositories.revive`: si el reviver es el propio owner, **no** se crea
notificación.

---

## 8. Modelo de datos

### 8.1 Tablas / campos nuevos que introduce esta propuesta

| Tabla | Campos | Notas |
| --- | --- | --- |
| `users` (existente) | **+ `role: "user" \| "admin"`** (default `"user"`), **+ `status: "active" \| "suspended"`** (default `"active"`) | `role` espejado en metadata pública de Clerk |
| `repositories` (existente) | **+ `deletedAt: number \| null`** | borrado lógico; preserva `lineage` |
| `reports` (nueva) | `ideaId: Id<"repositories">`, `reporterId: Id<"users">`, `reason: string`, `status: "pending" \| "resolved"`, `resolvedBy?: Id<"users">`, `resolvedAt?: number`, `note?: string`, `createdAt: number` | índice `by_status`, índice único `by_idea_reporter` |
| `job_runs` (nueva) | `jobName: string`, `startedAt: number`, `finishedAt?: number`, `status: "running" \| "success" \| "error"`, `errorMessage?: string` | índice `by_job_startedAt`; el cron escribe, el panel admin lee |
| `metrics_daily` (nueva, recomendada) | `date: string` (YYYY-MM-DD), `buried: number`, `revived: number`, `activeUsers: number`, `resurrectionRate: number`, `computedAt: number` | snapshot diario; escrito por un cron de agregación; el dashboard lee de acá para cargar rápido |
| `reminders` (existente en specs) | `repositoryId`, `ownerUserId`, `count: 0..3`, `nextRunAt: number`, `status: "active" \| "closed"`, `lastRespondedAt?: number` | índice `by_owner`, índice `by_nextRunAt` para el cron |
| `saved_ideas` (existente en specs) | `userId`, `repositoryId`, `createdAt` | índice único `by_user_repo` |

`lineage` no es tabla: es `LineageEntry[]` embebido en `repositories`
(`{ userId, action: "buried" \| "revived" \| "noted", note?, at }`).

### 8.2 Índices recomendados

| Índice | Sobre | Para |
| --- | --- | --- |
| `repositories.by_owner_status` | `(ownerUserId, status)` | `listMine`, filtros del Panel 1, escaneo del cron |
| `repositories.by_visibility_status` | `(visibility, status)` | `browsePublic` |
| `reports.by_status` | `(status, createdAt)` | cola de moderación |
| `job_runs.by_job_startedAt` | `(jobName, startedAt)` | "Estado del sistema" |
| `reminders.by_nextRunAt` | `(status, nextRunAt)` | cron `process-reminders` |
| `metrics_daily.by_date` | `(date)` | dashboard de métricas |

---

## 9. Mapa contra los contratos existentes

| Área de la propuesta | Estado en el repo | Acción requerida |
| --- | --- | --- |
| Importar de GitHub | cubierto — `packages/github` + `specs/github.md` | ninguna |
| Subir contenido manual | cubierto — `packages/manual-entry` + `specs/manual-entry.md` | ninguna |
| Mis ideas (`listMine`, `update`, `softDelete`) | parcialmente — `specs/repository.md` "reminders view" ya exige listar todo lo propio | change de módulo `repository`: agregar `deletedAt`, endpoint `update` de visibilidad, `softDelete` |
| Recordatorios + cron | mencionado en specs (`haunted`, "Mis recordatorios") | change de módulo `repository` + `convex`: formalizar tabla `reminders`, `respond`, cron |
| Guardadas / Linaje | `saved_ideas` y `lineage` ya existen en specs | exponer queries `savedIdeas.listMine`, `repositories.listMyLineage` |
| Rol `admin` + `requireAdmin` | **no existe** | change de `packages/auth` + `packages/user`: campo `role`, helper `requireAdmin`, sync a Clerk metadata |
| `/admin/metrics` + `metrics_daily` | **no existe** | change nuevo `admin-platform-panel` |
| `/admin/reports` + tabla `reports` + `/ideas/:id/report` | **no existe** | mismo change; `report` público toca `packages/repository` mínimamente |
| `/admin/system/health` + `job_runs` | **no existe** | mismo change; `job_runs` lo escribe el cron de `convex/` |
| `/admin/users` + `PATCH` rol/status | **no existe** | mismo change |
| Estado "latente" explícito | specs solo tienen `buried \| haunted \| revived \| undead` | decidir: modelar con `buried + private` (sin cambio) o agregar estado (change en `repository.md`) |

> **Regla de colaboración** (`specs/module-contracts.md`): cada cambio de módulo
> vive en su propio `openspec/changes/<módulo>-<slug>/` y solo toca los archivos
> de ese módulo. El Panel Admin es transversal → su propio change
> `admin-platform-panel`, no colgado del trabajo de otro módulo. `specs/flows.md`
> y la tabla de módulos se editan en cambios chicos aparte.

---

## 10. Reglas de seguridad transversales

1. **Verificación server-side siempre.** `role`, propiedad de un `repository`, y
   validez de sesión se comprueban en Convex, nunca en el cliente.
2. **Sin tokens en queries.** Tokens de instalación de GitHub y secretos de Clerk
   nunca se devuelven en una `query`/`mutation`. La private key del GitHub App
   vive solo en env de Convex.
3. **Escrituras con `requireOwner`.** Toda `mutation` sobre un `repository` valida
   `repo.ownerUserId === currentUser._id` antes de tocar nada (salvo acciones de
   moderación admin, que usan `requireAdmin`).
4. **Anónimos:** pueden leer browse/detalle de repos públicos y `listForRepository`
   de reacciones; no pueden reaccionar, revivir, guardar ni reportar.
5. **Privacidad de autopsia:** `visibility: private` ⇒ el detalle no devuelve
   cuerpo de autopsia ni artifacts a no-dueños. `public` / `public_no_code` ⇒
   devuelve autopsia pero **nunca** contenido de archivos del repo.
6. **Borrado lógico** para `repository` (via `deletedAt`) para no romper `lineage`
   ya construido por resurrecciones de otros.
7. **Cron autenticado por secreto**, no por JWT; el endpoint interno rechaza
   cualquier llamada sin `CRON_SHARED_SECRET` correcto.
8. **`user.deleted` de Clerk:** anonimiza o borra la fila `users` según decisión
   registrada antes de implementar; los `repository` de esa persona **no** se
   borran en cascada silenciosa (`specs/flows.md`).
