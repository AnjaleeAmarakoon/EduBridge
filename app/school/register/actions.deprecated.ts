/**
 * @deprecated This file is deprecated. Use API routes instead.
 * 
 * Migration guide:
 * - Register School: Use POST /api/schools/register
 * 
 * For client components, use:
 * const response = await fetch('/api/schools/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data)
 * });
 * 
 * See /lib/api-client.ts for helper functions
 * See /API_MIGRATION.md for full migration guide
 */

// This file is kept for reference only
// All functionality has been moved to:
// - /app/api/schools/register/route.ts
// - /services/school.service.ts

export {};
