# Shared Todo App - API Documentation

## Overview

This document provides comprehensive API documentation for the Shared Todo App backend services.

## Base URL

```
Development: http://localhost:3001/api/v1
Production: [To be configured]
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this consistent format:

```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2023-12-01T12:00:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

### POST /auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2023-12-01T12:00:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

### POST /auth/logout
Logout user (invalidate token).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true
}
```

### GET /auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2023-12-01T12:00:00Z"
  }
}
```

## Notes Endpoints

### GET /notes
Get user's notes with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "uuid",
        "title": "My Note",
        "content": "Note content",
        "authorId": "uuid",
        "createdAt": "2023-12-01T12:00:00Z",
        "updatedAt": "2023-12-01T12:00:00Z",
        "author": {
          "id": "uuid",
          "name": "John Doe",
          "email": "user@example.com"
        },
        "noteUsers": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 25,
      "totalPages": 3
    }
  }
}
```

### POST /notes
Create a new note.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "My New Note",
  "content": "This is the content of my note."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My New Note",
    "content": "This is the content of my note.",
    "authorId": "uuid",
    "createdAt": "2023-12-01T12:00:00Z",
    "updatedAt": "2023-12-01T12:00:00Z",
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "noteUsers": []
  }
}
```

### GET /notes/:id
Get a specific note by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Note",
    "content": "Note content",
    "authorId": "uuid",
    "createdAt": "2023-12-01T12:00:00Z",
    "updatedAt": "2023-12-01T12:00:00Z",
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "noteUsers": [
      {
        "id": "uuid",
        "noteId": "uuid",
        "userId": "uuid",
        "role": "editor",
        "joinedAt": "2023-12-01T12:00:00Z",
        "user": {
          "id": "uuid",
          "name": "Jane Doe",
          "email": "jane@example.com"
        }
      }
    ]
  }
}
```

### PUT /notes/:id
Update a note.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Note Title",
  "content": "Updated content"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Note Title",
    "content": "Updated content",
    "authorId": "uuid",
    "createdAt": "2023-12-01T12:00:00Z",
    "updatedAt": "2023-12-01T13:00:00Z",
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "noteUsers": []
  }
}
```

### DELETE /notes/:id
Delete a note.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true
}
```

## Note Sharing Endpoints

### POST /notes/:id/invite
Invite a user to collaborate on a note.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "collaborator@example.com",
  "role": "editor"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "uuid",
      "token": "invitation_token",
      "noteId": "uuid",
      "invitedEmail": "collaborator@example.com",
      "role": "editor",
      "status": "pending",
      "expiresAt": "2023-12-08T12:00:00Z",
      "createdAt": "2023-12-01T12:00:00Z"
    }
  }
}
```

### GET /notes/:id/users
Get all users with access to a note.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "noteId": "uuid",
        "userId": "uuid",
        "role": "admin",
        "joinedAt": "2023-12-01T12:00:00Z",
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "email": "user@example.com"
        }
      }
    ]
  }
}
```

### PUT /notes/:id/users/:userId
Update a user's role in a note.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true
}
```

### DELETE /notes/:id/users/:userId
Remove a user from a note.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true
}
```

## Invitation Endpoints

### GET /invitations/:token
Get invitation details by token.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "token": "invitation_token",
    "noteId": "uuid",
    "invitedEmail": "collaborator@example.com",
    "role": "editor",
    "status": "pending",
    "expiresAt": "2023-12-08T12:00:00Z",
    "createdAt": "2023-12-01T12:00:00Z",
    "note": {
      "id": "uuid",
      "title": "Shared Note",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "email": "user@example.com"
      }
    },
    "invitedBy": {
      "id": "uuid",
      "name": "John Doe",
      "email": "user@example.com"
    }
  }
}
```

### POST /invitations/:token/accept
Accept an invitation.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true
}
```

### POST /invitations/:token/decline
Decline an invitation.

**Response:**
```json
{
  "success": true
}
```

## Tasks Endpoints

### GET /tasks
Get tasks with filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string: pending, in_progress, completed, on_hold)
- `priority` (string: low, medium, high, critical)
- `assigneeId` (string)
- `authorId` (string)
- `noteId` (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Complete feature",
        "description": "Implement the new feature",
        "status": "in_progress",
        "priority": "high",
        "dueDate": "2023-12-15T12:00:00Z",
        "noteId": "uuid",
        "authorId": "uuid",
        "assigneeId": "uuid",
        "createdAt": "2023-12-01T12:00:00Z",
        "updatedAt": "2023-12-01T12:00:00Z",
        "author": {
          "id": "uuid",
          "name": "John Doe",
          "email": "user@example.com"
        },
        "assignee": {
          "id": "uuid",
          "name": "Jane Doe",
          "email": "jane@example.com"
        },
        "note": {
          "id": "uuid",
          "title": "Project Note"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 15,
      "totalPages": 2
    }
  }
}
```

### GET /tasks/notes/:noteId
Get tasks for a specific note.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Response:** Same format as GET /tasks

### POST /tasks/notes/:noteId
Create a new task in a note.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "dueDate": "2023-12-15T12:00:00Z",
  "assigneeId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "New Task",
    "description": "Task description",
    "status": "pending",
    "priority": "medium",
    "dueDate": "2023-12-15T12:00:00Z",
    "noteId": "uuid",
    "authorId": "uuid",
    "assigneeId": "uuid",
    "createdAt": "2023-12-01T12:00:00Z",
    "updatedAt": "2023-12-01T12:00:00Z",
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "assignee": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "note": {
      "id": "uuid",
      "title": "Project Note"
    }
  }
}
```

### GET /tasks/:id
Get a specific task by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same format as task object in POST response

### PUT /tasks/:id
Update a task.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Task",
  "description": "Updated description",
  "status": "completed",
  "priority": "high",
  "dueDate": "2023-12-20T12:00:00Z",
  "assigneeId": "uuid"
}
```

**Response:** Same format as task object in POST response

### DELETE /tasks/:id
Delete a task.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true
}
```

### POST /tasks/:id/assign
Assign a task to a user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "assigneeId": "uuid"
}
```

**Response:** Same format as task object in POST response

### POST /tasks/:id/unassign
Unassign a task.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same format as task object in POST response

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | User must be authenticated |
| `AUTHORIZATION_FAILED` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `INVALID_CREDENTIALS` | Login credentials are incorrect |
| `TOKEN_EXPIRED` | Authentication token has expired |
| `INVITATION_EXPIRED` | Invitation token has expired |
| `INVITATION_ALREADY_USED` | Invitation has already been accepted |
| `NETWORK_ERROR` | Network or server error occurred |
| `RATE_LIMIT_EXCEEDED` | Too many requests, rate limit exceeded |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints:** 100 requests per minute per IP
- **Authentication endpoints:** 10 requests per minute per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when rate limit window resets

## Permissions System

### Note Permissions

| Role | View | Edit | Invite | Delete |
|------|------|------|--------|--------|
| `viewer` | ✅ | ❌ | ❌ | ❌ |
| `editor` | ✅ | ✅ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ❌ |
| `owner` | ✅ | ✅ | ✅ | ✅ |

### Task Permissions

- **View:** Users with note access
- **Create:** Users with editor/admin role on note
- **Edit:** Task author or assignee
- **Delete:** Task author or note owner
- **Assign:** Users with editor/admin role on note

## Webhook Support

*Coming soon - Webhook endpoints for real-time notifications*

## SDK and Client Libraries

*Coming soon - Official client libraries for JavaScript/TypeScript, Python, and other languages*