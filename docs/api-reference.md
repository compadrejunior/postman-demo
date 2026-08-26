# API Reference

Base path: `/api`. All request/response bodies are JSON.

## Authentication

Endpoints marked **Auth required** expect an `Authorization: Bearer <token>` header, where `<token>` is the JWT returned from `POST /api/auth/login`.

## Roles

Every user has a `role` of `"user"` or `"admin"`. `POST /api/auth/register` always creates a `"user"`; there is no self-service way to become an admin (see [docs/setup.md](./setup.md) for how to promote one manually). A regular user can only see/modify their own tasks; an admin can read/update/delete **any** user's task by id, and can list tasks across all users via `GET /api/admin/tasks`. `GET /api/tasks` always returns only the caller's own tasks, admin or not.

---

## `POST /api/auth/register`

Auth required: no.

**Request body**

| Field    | Type   | Notes                          |
|----------|--------|---------------------------------|
| name     | string | required, non-empty             |
| email    | string | required, valid email           |
| password | string | required, min 8 characters      |

**Response `201`**

```json
{ "id": "uuid", "name": "Ada", "email": "ada@example.com", "role": "user" }
```

**Errors:** `400` invalid body, `409` email already registered.

---

## `POST /api/auth/login`

Auth required: no.

**Request body**

| Field    | Type   | Notes    |
|----------|--------|----------|
| email    | string | required |
| password | string | required |

**Response `200`**

```json
{
  "token": "jwt",
  "user": { "id": "uuid", "name": "Ada", "email": "ada@example.com", "role": "user" }
}
```

**Errors:** `400` invalid body, `401` wrong email/password.

---

## `POST /api/tasks`

Auth required: yes. Creates a task owned by the caller.

**Request body**

| Field       | Type   | Notes                                              |
|-------------|--------|-----------------------------------------------------|
| title       | string | required, non-empty                                 |
| description | string | optional, defaults to `""`                          |
| status      | string | optional, one of `todo`/`in-progress`/`done`, defaults to `todo` |
| priority    | string | optional, one of `low`/`medium`/`high`, defaults to `medium` |
| dueDate     | string \| null | optional, ISO 8601 date-time, defaults to `null` |

**Response `201`:** the created task (see [Task shape](#task-shape)).

**Errors:** `400` invalid body, `401` missing/invalid token.

---

## `GET /api/tasks`

Auth required: yes. Returns only the caller's own tasks.

**Response `200`:** array of [Task shape](#task-shape).

---

## `GET /api/tasks/:id`

Auth required: yes.

**Response `200`:** [Task shape](#task-shape).

**Errors:** `403` task belongs to another user (and caller is not an admin), `404` no such task.

---

## `PATCH /api/tasks/:id`

Auth required: yes. Partial update — at least one field required.

**Request body:** any subset of `title`, `description`, `status`, `priority`, `dueDate` (same types as create).

**Response `200`:** the updated task.

**Errors:** `400` invalid/empty body, `403` not the owner (and not an admin), `404` no such task.

---

## `DELETE /api/tasks/:id`

Auth required: yes.

**Response `204`:** empty body.

**Errors:** `403` not the owner (and not an admin), `404` no such task.

---

## `GET /api/admin/tasks`

Auth required: yes, and caller's role must be `admin`.

Lists tasks across **all** users.

**Response `200`:** array of [Task shape](#task-shape).

**Errors:** `401` missing/invalid token, `403` caller is not an admin.

---

## Task shape

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in-progress | done",
  "priority": "low | medium | high",
  "dueDate": "ISO 8601 string | null",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

## Error shape

Every non-2xx response has this shape:

```json
{ "error": { "code": "SOME_CODE", "message": "human-readable message" } }
```

`VALIDATION_ERROR` responses additionally include an `issues` array of `{ path, message }`.

| HTTP status | Codes                                                                 |
|-------------|-------------------------------------------------------------------------|
| 400         | `VALIDATION_ERROR`                                                    |
| 401         | `UNAUTHENTICATED` (missing/invalid token), `INVALID_CREDENTIALS` (login) |
| 403         | `FORBIDDEN` (route-level, e.g. non-admin on `/admin/tasks`), `UNAUTHORIZED_TASK_ACCESS` (resource-level ownership) |
| 404         | `TASK_NOT_FOUND`, `ROUTE_NOT_FOUND`                                    |
| 409         | `USER_ALREADY_EXISTS`                                                 |
| 500         | `INTERNAL_SERVER_ERROR`                                               |
