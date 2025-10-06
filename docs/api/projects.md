# Projects API Documentation

## Base URL
```
http://localhost:3000/api/projects
```

## Authentication
All endpoints require authentication via session cookies. Include session cookie in requests.

---

## Endpoints

### 1. Create Project

Creates a new project in a workspace. Supports both Development and Maintenance project types.

**Endpoint:** `POST /api/projects`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**

```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "workspaceId": "string (required)",
  "type": "DEVELOPMENT | MAINTENANCE (optional, defaults to DEVELOPMENT)",
  "status": "PLANNED | IN_PROGRESS | COMPLETED | CANCELED (optional, defaults to PLANNED)",
  "startDate": "string (optional, ISO 8601 date)",
  "targetDate": "string (optional, ISO 8601 date)"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Project name (minimum 1 character) |
| `description` | string | No | Project description |
| `workspaceId` | string | Yes | ID of the workspace this project belongs to |
| `type` | enum | No | Project type. Use `DEVELOPMENT` for new features/systems, `MAINTENANCE` for bug fixes and maintenance contracts |
| `status` | enum | No | Current project status |
| `startDate` | string | No | Project start date in ISO format (e.g., "2024-01-15") |
| `targetDate` | string | No | Target completion date in ISO format |

**Project Types:**
- **DEVELOPMENT**: For developing new systems/features with milestones
- **MAINTENANCE**: For maintenance contracts with SLA tracking and resolution time metrics

**Example Request - Development Project:**
```json
{
  "name": "E-commerce Platform",
  "description": "Build a new e-commerce platform with payment integration",
  "workspaceId": "cm123abc456",
  "type": "DEVELOPMENT",
  "status": "IN_PROGRESS",
  "startDate": "2024-01-15",
  "targetDate": "2024-06-30"
}
```

**Example Request - Maintenance Project:**
```json
{
  "name": "Client X Maintenance",
  "description": "Monthly maintenance contract for bug fixes and improvements",
  "workspaceId": "cm123abc456",
  "type": "MAINTENANCE",
  "status": "IN_PROGRESS"
}
```

**Success Response:**

**Code:** `201 Created`

**Body:**
```json
{
  "id": "cm123def789",
  "name": "E-commerce Platform",
  "description": "Build a new e-commerce platform with payment integration",
  "workspaceId": "cm123abc456",
  "type": "DEVELOPMENT",
  "status": "IN_PROGRESS",
  "startDate": "2024-01-15T00:00:00.000Z",
  "targetDate": "2024-06-30T00:00:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "workspace": {
    "id": "cm123abc456",
    "name": "My Workspace",
    "slug": "my-workspace"
  }
}
```

**Error Responses:**

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request** - Validation error
```json
{
  "error": "Name is required"
}
```

**403 Forbidden** - User doesn't have access to workspace
```json
{
  "error": "Access denied to workspace"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

---

### 2. List Projects

Retrieves all projects the authenticated user has access to.

**Endpoint:** `GET /api/projects`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | string | No | Filter projects by workspace ID |
| `status` | string | No | Filter by status (PLANNED, IN_PROGRESS, COMPLETED, CANCELED) |

**Example Request:**
```bash
GET /api/projects?workspaceId=cm123abc456&status=IN_PROGRESS
```

**Success Response:**

**Code:** `200 OK`

**Body:**
```json
[
  {
    "id": "cm123def789",
    "name": "E-commerce Platform",
    "description": "Build a new e-commerce platform",
    "workspaceId": "cm123abc456",
    "type": "DEVELOPMENT",
    "status": "IN_PROGRESS",
    "startDate": "2024-01-15T00:00:00.000Z",
    "targetDate": "2024-06-30T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "workspace": {
      "id": "cm123abc456",
      "name": "My Workspace",
      "slug": "my-workspace"
    },
    "_count": {
      "issues": 25
    }
  },
  {
    "id": "cm456ghi012",
    "name": "Client X Maintenance",
    "description": "Monthly maintenance contract",
    "workspaceId": "cm123abc456",
    "type": "MAINTENANCE",
    "status": "IN_PROGRESS",
    "startDate": null,
    "targetDate": null,
    "createdAt": "2024-01-10T09:00:00.000Z",
    "updatedAt": "2024-01-20T14:30:00.000Z",
    "workspace": {
      "id": "cm123abc456",
      "name": "My Workspace",
      "slug": "my-workspace"
    },
    "_count": {
      "issues": 42
    }
  }
]
```

**Error Responses:**

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

---

## CORS Support

All endpoints support CORS preflight requests.

**Endpoint:** `OPTIONS /api/projects`

**Success Response:**
**Code:** `204 No Content`

---

## Usage Examples

### Using cURL

**Create Development Project:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Mobile App Redesign",
    "description": "Complete redesign of mobile application",
    "workspaceId": "cm123abc456",
    "type": "DEVELOPMENT",
    "status": "PLANNED",
    "startDate": "2024-02-01",
    "targetDate": "2024-05-31"
  }'
```

**Create Maintenance Project:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Company ABC Support",
    "description": "Ongoing support and maintenance",
    "workspaceId": "cm123abc456",
    "type": "MAINTENANCE",
    "status": "IN_PROGRESS"
  }'
```

**List All Projects:**
```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Cookie: your-session-cookie"
```

**Filter Projects by Workspace:**
```bash
curl -X GET "http://localhost:3000/api/projects?workspaceId=cm123abc456" \
  -H "Cookie: your-session-cookie"
```

### Using JavaScript/TypeScript (fetch)

**Create Development Project:**
```typescript
const response = await fetch('http://localhost:3000/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for session cookies
  body: JSON.stringify({
    name: 'Mobile App Redesign',
    description: 'Complete redesign of mobile application',
    workspaceId: 'cm123abc456',
    type: 'DEVELOPMENT',
    status: 'PLANNED',
    startDate: '2024-02-01',
    targetDate: '2024-05-31'
  })
});

const project = await response.json();
console.log('Created project:', project);
```

**Create Maintenance Project:**
```typescript
const response = await fetch('http://localhost:3000/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Client Support Contract',
    description: 'Bug fixes and maintenance for client',
    workspaceId: 'cm123abc456',
    type: 'MAINTENANCE',
    status: 'IN_PROGRESS'
  })
});

const project = await response.json();
console.log('Created maintenance project:', project);
```

**List Projects:**
```typescript
const response = await fetch('http://localhost:3000/api/projects?workspaceId=cm123abc456', {
  method: 'GET',
  credentials: 'include',
});

const projects = await response.json();
console.log('Projects:', projects);
```

---

## Notes

1. **Authentication Required**: All endpoints require valid session authentication. Make sure to include session cookies in requests.

2. **Workspace Access**: Users can only create projects in workspaces they are members of. The API validates workspace membership before creating projects.

3. **Project Types**:
   - Use `DEVELOPMENT` for feature development, new systems, and projects with milestones
   - Use `MAINTENANCE` for bug fixes, maintenance contracts, and support work that requires SLA tracking

4. **Maintenance Projects**: When you create a project with `type: "MAINTENANCE"`, issues in that project can track:
   - Resolution time in business hours
   - SLA compliance
   - First response time
   - Reopen count

5. **Date Format**: Dates should be provided in ISO 8601 format (YYYY-MM-DD). The API will convert them to full ISO datetime strings.

6. **CORS**: The API supports CORS for cross-origin requests. Use the OPTIONS method for preflight requests.

7. **Validation**: All required fields are validated before project creation. Invalid data will return a 400 error with details.

8. **Response Includes**: The response includes the associated workspace information and issue count for convenience.
