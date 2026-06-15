---
name: content-type-agent
description: Agent playbook for adding a database-backed content type with schema, migration journal, seed data, tasks, and CRUD UI in a Next.js/Drizzle-style project. Use when asked to add a model, entity, resource, collection, CRUD pages, or admin data table.
---

# Content Type Agent

Use this playbook when a user asks to add a new content type such as `pizza`, `product`, `customer`, `order`, or similar. The goal is to deliver the full vertical slice: database schema, migration with journal metadata, seed data, task automation, data access helpers, server mutations, list/detail CRUD UI, and verification.

Keep the implementation native to the current repository. Inspect first, then copy existing patterns.

## Intake Questions

If the initial request does not answer these, ask concise follow-up questions before editing. Ask only what is necessary; infer conservative defaults from the repo when safe.

1. **Content type**
   - What is the singular and plural name?
   - What route should expose it, for example `/pizza` or `/admin/pizza`?

2. **Fields**
   - What fields should exist, with types and required/optional status?
   - Which field is the display name?
   - Should `id` be UUID, serial integer, cuid, or an existing convention?
   - Are there constraints: unique, enum values, min/max, decimal precision, indexes, foreign keys?

3. **Seed data**
   - Should seed data be added?
   - How many rows and what values?
   - Should seeds be idempotent by fixed IDs or natural unique keys?

4. **CRUD behavior**
   - Which operations are required: create, read, update, delete?
   - Should delete be hard delete, soft delete, or disabled?
   - Should edits happen in a sheet/modal, full page, inline row, or existing pattern?

5. **List behavior**
   - Which columns should show in the data table?
   - Which fields are searchable?
   - Which columns are sortable?
   - Should search and sort live in URL query params?

6. **UI dependencies**
   - If required UI primitives are missing, should the agent add local components or provide shadcn commands for the user to run?
   - Default command format: `npx shadcn@latest add input table sheet label dialog dropdown-menu badge separator`.

7. **Verification**
   - Is the local database already running?
   - Should the agent run migrations/seeds against local data?
   - Is browser verification expected?

## Repository Discovery

Before writing code:

- Read project instructions such as `AGENTS.md`, `CLAUDE.md`, or local agent docs.
- If this is a Next.js project, read the relevant local Next docs from `node_modules/next/dist/docs/` before editing route code. Do not assume older Next APIs.
- Inspect:
  - `package.json`
  - `Taskfile.yml`, `Makefile`, or package scripts
  - ORM config such as `drizzle.config.ts`
  - existing schema/migration folders
  - existing seed scripts
  - existing data access helpers
  - existing route/component conventions
  - `components.json` and `components/ui/*` for shadcn style
- Check `git status --short`; never revert unrelated user changes.

## Implementation Workflow

### 1. Database Schema

Prefer the project ORM and naming convention.

For Drizzle/PostgreSQL projects:

- Put tables in the existing schema module, commonly `db/schema.ts`.
- Use `uuid("id").defaultRandom().primaryKey()` when no other ID convention exists.
- Use camelCase TypeScript property names for snake_case columns, for example `bakingTime: integer("baking_time")`.
- Export select/insert types:

```ts
export type Entity = typeof entities.$inferSelect
export type NewEntity = typeof entities.$inferInsert
```

Add useful constraints and indexes when the user asked for them or the repo already has a pattern.

### 2. Migration And Journal

Do not hand-write Drizzle journal metadata unless there is no generator available.

For Drizzle:

1. Add or update `drizzle.config.ts` if missing.
2. Generate SQL with a named migration:

```bash
corepack pnpm drizzle-kit generate --name create_<plural>
```

3. Confirm all generated files are present:
   - `drizzle/<index>_<name>.sql`
   - `drizzle/meta/_journal.json`
   - `drizzle/meta/<index>_snapshot.json`

4. Run:

```bash
corepack pnpm drizzle-kit check
```

If the project needs runtime migrations, prefer a programmatic migrator such as:

```ts
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { closePool, getDb } from "@/db"

try {
  await migrate(getDb(), { migrationsFolder: "drizzle" })
} finally {
  await closePool()
}
```

### 3. Lazy Database Access

In Next.js App Router projects, do not initialize database clients at module scope for app runtime code. Use a lazy getter so `next build` and static analysis do not crash when env vars are unavailable.

Pattern:

```ts
let pool: Pool | undefined

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to connect to the database")
  }

  pool ??= new Pool({ connectionString: process.env.DATABASE_URL })
  return pool
}

export function getDb() {
  return drizzle(getPool(), { schema })
}

export async function closePool() {
  await pool?.end()
  pool = undefined
}
```

### 4. Seed Data

Add an idempotent seed script. For Drizzle, fixed UUIDs are a good default when there is no natural unique key.

Use upsert semantics:

```ts
await getDb()
  .insert(table)
  .values(seedRows)
  .onConflictDoUpdate({
    target: table.id,
    set: {
      name: sql`excluded.name`,
    },
  })
```

Close the pool in `finally`.

### 5. Tasks

Add or update task automation in the project’s task runner.

For this repo style:

```yaml
migrate:
  desc: Apply database migrations
  cmds:
    - corepack pnpm exec tsx db/migrate.ts

seed:
  desc: Seed local database content
  cmds:
    - task: migrate
    - corepack pnpm exec tsx db/seed.ts
```

If the DB is not always running, either leave `task up` separate or ask whether `migrate` should depend on it. Do not force Docker startup if the user says the DB is already running.

### 6. Data Access Layer

Create a small module for the content type, for example `db/pizzas.ts`.

Include:

- `list<Plural>({ query, sort, direction })`
- `get<Singular>ById(id)`
- `create<Singular>(values)`
- `update<Singular>(id, values)`
- `delete<Singular>(id)`

Keep sorting allow-listed. Do not pipe arbitrary query params into SQL column names.

### 7. Server Actions

For Next.js App Router:

- Put mutations in a dedicated `"use server"` file, commonly `app/<route>/actions.ts`.
- Validate and normalize input.
- Return a small serializable result object.
- Revalidate affected routes with `revalidatePath`.
- Do not return raw errors or sensitive data to client components.

### 8. CRUD UI

Default route shape:

```txt
app/<route>/page.tsx
app/<route>/[id]/page.tsx
app/<route>/_components/<entity>-table.tsx
app/<route>/_components/<entity>-edit-sheet.tsx
app/<route>/actions.ts
```

List page:

- Server component reads `searchParams` as a Promise in Next 16.
- Fetch filtered/sorted rows on the server.
- Pass rows to a client table component.
- Wrap `useSearchParams` client components in `Suspense` if needed.
- Use `connection()` when runtime rendering is needed and no other request-time API guarantees it.

Client table:

- Use `useSearchParams`, `usePathname`, and `useRouter` for URL-backed search/sort.
- Use stable query keys such as `q`, `sort`, and `dir`.
- Use shadcn-style `Table`, `Input`, `Button`.
- Use icons for view, edit, sort direction, create, save, delete.
- Include an empty state.
- Ensure mobile has no incoherent overlap or horizontal page overflow.

Detail page:

- Use dynamic `[id]` route params as a Promise in Next 16.
- Fetch by ID on the server.
- Call `notFound()` when missing.
- Reuse the same edit sheet used by the list page.

Edit sheet:

- One reusable client component for create and update.
- Accept optional existing record plus optional trigger.
- Use accessible labels and explicit field errors.
- Close on success and call `router.refresh()`.
- If delete is included, make the control clearly destructive.

### 9. UI Components

Prefer existing local shadcn primitives. If missing:

- If the user allows code edits for UI primitives, add local components matching the repo’s style.
- If the user asked to add manually, provide exact commands instead of installing:

```bash
npx shadcn@latest add input table sheet label
```

Use the repo’s established button variants, radius, typography, and token colors. Avoid introducing unrelated palettes or marketing layouts for operational CRUD screens.

## Verification Checklist

Run the strongest checks available in the repo:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm drizzle-kit check
task seed
```

If a command fails because of sandboxed Docker, local sockets, or database access, rerun with approval when necessary and explain the exact reason.

Browser verification for CRUD pages:

- Load the list route.
- Confirm seeded rows render.
- Search updates URL and filters rows.
- Sorting updates URL and order.
- Create a temporary row.
- Quick edit the row.
- Open detail page.
- Open the shared edit sheet from detail.
- Delete the temporary row.
- Confirm no console errors.
- Check mobile width around 390px for horizontal overflow.

After smoke tests, restore mutated seed data or delete temporary test rows.

## Completion Summary

Final response should include:

- Files/areas changed.
- Migration and journal status.
- Task names added.
- CRUD routes added.
- Verification commands and browser smoke-test result.
- Any commands the user still needs to run manually, especially shadcn component commands if not added by the agent.

Keep the summary short and concrete.
