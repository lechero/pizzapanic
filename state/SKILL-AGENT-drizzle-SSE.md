---
name: drizzle-sse
description: Implement targeted Server-Sent Events in a shadcn-based React or Next.js app that uses Drizzle ORM. Use when a UI page or component should update immediately after a Drizzle-backed record changes, especially when only authorized clients for a user, organization, tenant, trackingId, record id, run id, or similar recipient selector should receive the event. The agent must inspect Drizzle schemas, app pages, components, existing auth, and API patterns first, then suggest likely source/display/audience candidates if the user has not provided them.
---

# Drizzle Targeted SSE

Use this skill to add a narrow real-time update path:

Drizzle-backed change -> event producer -> authenticated SSE endpoint -> client hook/component -> shadcn UI surface.

Prefer a small targeted event plus refetch over streaming full records. Do not broadcast private updates to every connected client.

## First Response

Do not start by asking a blank questionnaire. Inspect the repo first unless the user has already provided exact files and selectors.

If source/display/audience details are missing, search Drizzle schemas and pages, then suggest likely candidates:

- "I found these likely source tables: ..."
- "I found these likely pages/components to update: ..."
- "I found these likely ownership keys: ..."

Ask only for the missing choice the repo cannot prove. If one reasonable candidate is clearly dominant, state the assumption and proceed.

Minimum details needed before implementation:

- Source: the Drizzle table/record/event whose change should trigger SSE.
- Display: the page, route, component, or shadcn surface that should update.
- Audience: the recipient selector and authorization rule, such as `userId`, `organizationId`, `tenantId`, `trackingId`, `recordId`, `runId`, or admin override.
- Producer: the code path that writes the source change, such as a server action, route handler, mutation, webhook, worker, cron job, or queue.

## Discovery Pass

Run fast searches before asking the user for file names:

```sh
rg --files -g '!node_modules' -g '!dist' -g '!build' | rg '(^|/)(drizzle\.config|schema|relations|db|database|page|layout|route|actions|components|features|hooks)'
rg -n "pgTable|mysqlTable|sqliteTable|relations\\(|drizzle\\(|db\\.|auth\\(|getSession|currentUser|session|userId|organizationId|tenantId|trackingId|EventSource|text/event-stream|shadcn|components/ui" .
```

Then identify:

- Drizzle schema files: commonly `db/schema.ts`, `src/db/schema.ts`, `lib/db/schema.ts`, `server/db/schema.ts`, or `drizzle/schema.ts`.
- DB client files: commonly `db/index.ts`, `lib/db.ts`, `server/db/index.ts`, or imports named `db`.
- Existing auth/session helpers.
- Existing API mutation patterns: route handlers, server actions, RPC routers, loaders/actions, workers.
- Existing page surfaces: `app/**/page.tsx`, `pages/**`, `src/routes/**`, `components/**`, `features/**`.
- Existing shadcn components under `components/ui` or the configured alias in `components.json`.

If the user did not name a source, propose tables that have status, ownership, or timestamp columns:

- candidate source: tables with `status`, `state`, `progress`, `updatedAt`, `completedAt`, `failedAt`, `jobId`, `runId`, `trackingId`, `userId`, `organizationId`, or `tenantId`.
- candidate display: pages/components that import or query those tables, call related API routes, or render matching words from table names.
- candidate audience: ownership columns and joins found in schema relations.

## Architecture Choices

Prefer the smallest reliable event transport already available in the stack.

- Same Node process writes the change and serves SSE: a scoped in-memory emitter can work for local/single-process apps, but document that it does not cross processes.
- Multiple server processes, workers, serverless instances, or background jobs: use a shared channel such as Postgres `LISTEN/NOTIFY`, Redis/Valkey pub/sub, queue events, or another existing broker.
- Existing queue worker already emits progress: subscribe to queue events if the queue system supports it.
- External DB changes with no application write path: add a database trigger/notification or keep polling; SSE cannot detect arbitrary Drizzle changes by itself.

For serverless deployments, verify the platform supports long-lived SSE. If not, use polling, provider realtime, or a hosted pub/sub/realtime service.

## Security Rules

- Authenticate the SSE endpoint unless the user explicitly says the updates are public.
- Native browser `EventSource` sends cookies but does not support custom request headers. Do not design the browser client around bearer headers unless using a custom fetch-based SSE client.
- Never put secrets in SSE URLs. Opaque public tracking ids may be query params; credentials may not.
- Validate all route params and query selectors before using them.
- Authorize the requested selector against Drizzle before opening the stream.
- Filter every outgoing event by the same selector before sending it.
- Do not trust the frontend to ignore unrelated events; the server must not send unrelated private events.
- Events should contain only fields the subscribed client may already fetch.

## Implementation Workflow

1. Map the source.
   - Read the Drizzle table definition and relations.
   - Find the write path that updates the relevant row.
   - Identify the stable selector to include in every event.

2. Map the display.
   - Find the page route and the component that owns the visible state.
   - Prefer adding a small client hook near the feature instead of embedding stream logic inside a large shadcn component.
   - Use existing shadcn state and loading/error patterns.

3. Map the audience.
   - Build or reuse an authorization helper that returns whether the current session may subscribe to the selector.
   - Prefer joins through Drizzle relations or explicit `where(and(...))` queries.
   - Decide between `404` and `403` based on local API conventions.

4. Define a typed event.
   - Put event types near the feature, not in a global kitchen-sink file.
   - Include `type`, selector fields, operation/status, and optional small patch fields.
   - Include a terminal state for jobs/runs that complete or fail.

5. Add or reuse the publisher.
   - Publish after the database write commits or after the durable source is known to be updated.
   - For transaction-heavy code, avoid sending success before the transaction can roll back.
   - Keep the publisher API narrow: `publishThingChanged({ selectorId, status, ... })`.

6. Add the SSE endpoint.
   - Match the framework's route style: Next.js route handler, Express route, Hono route, Remix resource route, etc.
   - Set `Content-Type: text/event-stream`, disable caching, send an initial comment, send heartbeat comments, and clean up on disconnect.
   - Subscribe only after authentication and authorization pass.

7. Add the client hook/component wiring.
   - Open `EventSource` only when the selector is present and the component is mounted.
   - Parse events defensively and ignore wrong `type`/selector values.
   - Patch local state for small updates.
   - Refetch canonical data after terminal events or when payloads are intentionally minimal.
   - Close the stream in cleanup.

8. Verify with two audiences.
   - Authorized client receives the expected update.
   - Unauthorized or non-matching client receives no data event.

## Generic Drizzle Authorization Shape

Adapt names to the discovered schema.

```ts
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { records } from "@/db/schema"

export async function canSubscribeToRecord(input: {
  recordId: string
  userId: string
  isAdmin?: boolean
}) {
  const [row] = await db
    .select({ id: records.id })
    .from(records)
    .where(
      input.isAdmin
        ? eq(records.id, input.recordId)
        : and(eq(records.id, input.recordId), eq(records.userId, input.userId))
    )
    .limit(1)

  return Boolean(row)
}
```

For organization/tenant auth, join or filter by the membership table instead of trusting `organizationId` from the URL.

## Next.js Route Handler Shape

Use this only when the repo is Next.js App Router. For other frameworks, keep the same authentication, authorization, heartbeat, and cleanup behavior.

```ts
import { headers } from "next/headers"

import { auth } from "@/auth"
import { canSubscribeToRecord } from "@/server/realtime/access"
import { subscribeToRecordEvents } from "@/server/realtime/events"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { id } = await context.params
  const allowed = await canSubscribeToRecord({
    recordId: id,
    userId: session.user.id,
    isAdmin: (session.user as { role?: string }).role === "ADMIN",
  })
  if (!allowed) return new Response("Not found", { status: 404 })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      let closed = false

      controller.enqueue(encoder.encode(": connected\n\n"))

      const unsubscribe = subscribeToRecordEvents(id, (event) => {
        if (closed) return
        if (event.recordId !== id) return

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          closed = true
        }
      })

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          closed = true
          clearInterval(heartbeat)
        }
      }, 20_000)

      req.signal.addEventListener("abort", () => {
        closed = true
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // Already closed.
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
```

## Client Hook Shape

```tsx
"use client"

import { useEffect } from "react"

export function useRecordEvents(input: {
  recordId: string | null
  onPatch: (event: RecordChangedEvent) => void
  refetch?: () => Promise<unknown>
}) {
  useEffect(() => {
    if (!input.recordId) return

    const events = new EventSource(`/api/records/${input.recordId}/events`)

    events.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RecordChangedEvent
        if (event.type !== "record.changed") return
        if (event.recordId !== input.recordId) return

        input.onPatch(event)

        if (event.status === "success" || event.status === "error") {
          void input.refetch?.()
        }
      } catch {
        // Ignore malformed events.
      }
    }

    events.onerror = () => {
      if (events.readyState === EventSource.CLOSED) {
        void input.refetch?.()
      }
    }

    return () => {
      events.close()
    }
  }, [input.recordId, input.onPatch, input.refetch])
}
```

## shadcn UI Guidance

- Keep stream connection state out of presentational `components/ui/*` primitives.
- Put SSE state in a feature hook or page-level client component, then pass ordinary props into shadcn cards, tables, badges, progress bars, toasts, or buttons.
- Use existing project conventions for `toast`, `sonner`, badges, skeletons, and disabled button states.
- Do not add visible explanatory text about SSE mechanics to the UI.
- Avoid full-page reloads; refetch only the affected query or server action data if the app has an existing data layer.

## Verification

Run relevant local checks after implementation:

- typecheck/lint for changed files;
- focused unit tests for payload shaping or authorization helpers;
- route/API smoke test for unauthorized and authorized subscriptions;
- browser verification that the target shadcn UI updates without a reload.

Manual verification matrix:

- Client A owns or may view selector X and receives event X.
- Client A does not receive event Y.
- Client B cannot view selector X and receives no event X.
- Refresh/refetch recovers canonical state after reconnect or terminal status.

## Common Pitfalls

- Asking the user to name schema/page files before searching the repo.
- Treating Drizzle as a realtime system; Drizzle writes do not automatically emit SSE.
- Using `EventSource` with required custom auth headers.
- Opening the stream before proving authorization.
- Filtering only in React instead of filtering on the server.
- Using process-local emitters when events are produced by workers or other server instances.
- Sending large rows over SSE instead of small patch/refetch signals.
- Editing shadcn UI primitives when the change belongs in a feature hook or page client component.
