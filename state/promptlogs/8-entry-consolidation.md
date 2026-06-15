respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repo and plan to implement the following:

adjust the root page at / to display:

- Menu
----
- Be Courier
- Be Tony
----
- Panic Attack

panic attack should call the /api/panic endpoint which will generate between 5 and 20 random orders and send it to the system. This will allow us to test the panic timers and SSE updates in real-time.
