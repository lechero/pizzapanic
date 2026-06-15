respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md) 
Please inspect the repo and align with our plan in `state/PLAN-mind.md` -> For now we will focus on the "order" part of the plan, exclude the rest
Implement a proper drizzle dev setup for SQLite and create the "order" table with the following schema:
```
db schema:
- order
    - id
    - trackingId
    - status
    - panic
    - order: [pizzaId, ...]
    - courierId: id || null
```

the sqlite database file should be created in the ./var folder and should be named "pizza-panic.sqlite".
properly include migration files and a migration script in the Taskfile.yml -> `migrate` -> this should run the drizzle-kit migration command
scaffold the CRUD according to state/SKILL-AGENT-content-type.md for the "order" content type -> this should be placed in `app/api/order/route.ts` and should follow the vercel best practices for API routes
