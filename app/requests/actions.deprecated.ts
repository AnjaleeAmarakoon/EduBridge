/**
 * @deprecated This file is deprecated. Use API routes instead.
 * 
 * Migration guide:
 * - Get Requests: Use GET /api/requests
 * - Create Request: Use POST /api/requests
 * - Get Request by ID: Use GET /api/requests/[id]
 * - Update Status: Use PUT /api/requests/[id]/status
 * - Respond: Use POST /api/requests/[id]/respond
 * - Delete: Use DELETE /api/requests/[id]
 * 
 * For server components, use RequestService directly:
 * import { RequestService } from '@/services/request.service';
 * 
 * For client components, use API client:
 * import { requestApi } from '@/lib/api-client';
 * 
 * See /API_MIGRATION.md for full migration guide
 */

// This file is kept for reference only
// All functionality has been moved to:
// - /app/api/requests/* (API routes)
// - /services/request.service.ts (business logic)

export {};
