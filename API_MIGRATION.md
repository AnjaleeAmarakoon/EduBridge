# API Architecture Migration - Complete ✅

## Overview

This project has been migrated from **Server Actions** to **API Routes** for all backend operations. The new architecture follows best practices with clean separation of concerns.

## Architecture

```
src/
├── app/
│   ├── api/                    # API Route Handlers
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── signup/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   ├── profile/route.ts
│   │   │   ├── forgot-password/route.ts
│   │   │   └── reset-password/route.ts
│   │   ├── schools/
│   │   │   ├── register/route.ts
│   │   │   └── me/route.ts
│   │   └── requests/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           ├── status/route.ts
│   │           └── respond/route.ts
│   ├── auth/                   # Auth pages (client components)
│   ├── dashboard/              # Dashboard pages
│   ├── requests/               # Request pages
│   └── school/                 # School pages
├── services/                   # Business Logic Layer
│   ├── auth.service.ts
│   ├── school.service.ts
│   └── request.service.ts
├── lib/
│   ├── api-client.ts          # Frontend API client utility
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── types/
│       └── database.ts
└── middleware.ts              # Next.js middleware
```

## Key Changes

### 1. Services Layer
All business logic has been extracted into service classes:
- **AuthService**: User authentication and profile management
- **SchoolService**: School registration and management
- **RequestService**: Request CRUD operations

### 2. API Routes
RESTful API endpoints with proper HTTP methods:
- **POST** for creating resources
- **GET** for fetching data
- **PUT** for updating resources
- **DELETE** for removing resources

### 3. Frontend Updates
All forms now use `fetch()` with proper:
- JSON serialization
- Error handling
- Loading states
- Type safety

## API Endpoints

### Authentication
```typescript
POST   /api/auth/login           - Login user
POST   /api/auth/signup          - Register new user
POST   /api/auth/logout          - Logout user
GET    /api/auth/me              - Get current user
PUT    /api/auth/profile         - Update user profile
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password
```

### Schools
```typescript
POST   /api/schools/register     - Register new school
GET    /api/schools/me           - Get current user's school
```

### Requests
```typescript
GET    /api/requests             - Get all requests (with filters)
POST   /api/requests             - Create new request
GET    /api/requests/[id]        - Get request by ID
DELETE /api/requests/[id]        - Delete request
PUT    /api/requests/[id]/status - Update request status
POST   /api/requests/[id]/respond - Respond to request
```

## Usage Examples

### Using API Client Utility

```typescript
import { authApi, requestApi } from '@/lib/api-client';

// Login
const result = await authApi.login(email, password);

// Create request
const request = await requestApi.create({
  title: 'Need textbooks',
  description: '...',
  category: 'Education Materials',
  type: 'money',
  urgency: 'High'
});

// Get all requests with filters
const requests = await requestApi.getAll({
  category: 'Education Materials',
  type: 'money'
});
```

### Direct Fetch Usage

```typescript
// POST request
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});

const data = await response.json();

if (!response.ok) {
  console.error(data.error);
} else {
  router.push(data.redirectTo);
}
```

## Error Handling

All API routes return consistent error responses:

```typescript
// Error response
{
  error: "Error message"
}

// Success response
{
  success: true,
  data: { ... },
  redirectTo: "/path"  // optional
}
```

## Server Components vs Client Components

- **Server Components**: Use service layer directly for data fetching
- **Client Components**: Use API routes via fetch for user interactions

```typescript
// Server Component (page.tsx)
import { RequestService } from '@/services/request.service';

export default async function RequestsPage() {
  const { requests } = await RequestService.getRequests();
  return <div>...</div>;
}

// Client Component (form)
'use client';
export default function CreateForm() {
  const handleSubmit = async () => {
    await fetch('/api/requests', { method: 'POST', ... });
  };
}
```

## Benefits

1. **Clear Separation**: Business logic in services, HTTP handling in routes
2. **Type Safety**: Full TypeScript support throughout
3. **Testability**: Services can be unit tested independently
4. **Flexibility**: Easy to add new endpoints or modify existing ones
5. **Standards**: RESTful API following HTTP conventions
6. **Reusability**: Services can be used by routes or server components

## Migration Status

✅ **Completed:**
- Auth actions → API routes
- School registration → API routes
- Request management → API routes
- All frontend forms updated
- Services layer created
- API client utility created
- Error handling standardized

## Files to Remove (Deprecated)

The following Server Action files are now deprecated and can be removed:
- `app/auth/actions.ts`
- `app/auth/password-reset/actions.ts`
- `app/requests/actions.ts`
- `app/school/register/actions.ts`

## Testing

Test all endpoints:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get requests
curl http://localhost:3000/api/requests?type=money

# Create request (requires auth)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"title":"Need books","type":"money",...}'
```

## Next Steps

1. ✅ All migrations complete
2. ✅ Test all endpoints
3. ⏭️ Add API rate limiting (optional)
4. ⏭️ Add request logging (optional)
5. ⏭️ Add API documentation with Swagger (optional)
