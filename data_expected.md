# Expected data contracts

Mock JSON para reportes.

Status para `Report.status`: `"creado" | "en_revision" | "resuelto"`.

---

## Role

```json
{
  "id": "rol-reportante",
  "slug": "reportante",
  "name": "Reportante",
  "description": "Reporta fallas y da seguimiento"
}
```

otros roles esperados: `rol-tecnico`, `rol-responsable`, `rol-coordinador`, `rol-validador`, `rol-administrador`.
avatarUrl (img url opcional, puede no ser contemplado)

---

## User

```json
{
  "id": "usr-ana",
  "name": "Ana Pérez",
  "email": "ana.perez@example.com",
  "roleId": "rol-reportante",
  "campusId": "cam-central",
  "avatarUrl": null
}
```

---

## Campus

```json
{
  "id": "cam-central",
  "name": "Campus Central",
  "code": "CC"
}
```

---

## Space

Ubicación física (edificio / aula), ligada a un campus.

```json
{
  "id": "spc-cc04-304",
  "campusId": "cam-central",
  "code": "CC04",
  "room": "304",
  "label": "CC04 - 304"
}
```

---

## Report

```json
{
  "id": "rep-banos-sucios",
  "title": "Baños sucios",
  "description": "Los sanitarios del segundo piso no tienen insumos y el piso está mojado.",
  "campusId": "cam-central",
  "spaceId": "spc-cc04-304",
  "status": "creado",
  "imageUrl": "/login-img.jpg",
  "authorId": "usr-ana",
  "classified": false,
  "priority": null,
  "awaitingValidation": false,
  "createdAt": "2026-09-08T14:20:00.000Z",
  "updatedAt": "2026-09-08T14:20:00.000Z"
}
```

`priority`: `"baja" | "media" | "alta" | null`.  
`classified`: set by Responsable de área.  
`awaitingValidation`: `true` when status is `resuelto` and Validador has not confirmed yet.

---

## Assignment

```json
{
  "id": "asg-1",
  "reportId": "rep-fuga-agua",
  "technicianId": "usr-carlos",
  "assignedById": "usr-miguel",
  "assignedAt": "2026-09-08T16:00:00.000Z"
}
```

---

## ReportEvent

Historial para la línea de tiempo (Creado → En revisión → Resuelto).

```json
{
  "id": "evt-1",
  "reportId": "rep-fuga-agua",
  "status": "creado",
  "actorId": "usr-ana",
  "at": "2026-09-07T09:00:00.000Z"
}
```

---

## WorkLog

Documentación del técnico.

```json
{
  "id": "wlg-1",
  "reportId": "rep-fuga-agua",
  "technicianId": "usr-carlos",
  "notes": "Se reemplazó la válvula y se verificó que no hay goteo.",
  "at": "2026-09-09T11:30:00.000Z"
}
```

---

## Validation

```json
{
  "id": "val-1",
  "reportId": "rep-luz-pasillo",
  "validatorId": "usr-elena",
  "resolved": true,
  "comment": "La iluminación quedó correcta.",
  "at": "2026-09-09T18:00:00.000Z"
}
```

---

## AppSettings

Parámetros generales (Administrador).

```json
{
  "id": "set-default",
  "slaHours": 48,
  "allowCommunityReports": true,
  "defaultCampusId": "cam-central"
}
```
