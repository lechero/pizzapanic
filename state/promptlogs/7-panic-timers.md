respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repo and plan to implement the following:
   
if max timeouts have been reached for and order/status according to defined constants:
        maxTimeouts: {
            received: number
            cooking: number ( + panicTimes bounces)
            cooked: number
            transit: number ( bit more since no distance data)
        }
        the dashboard should mark it as "panic" -> show UX badges/coloring 

add the maxTimeouts as constants like [pizzas.ts](/Users/miguelfuentes/projects/pizza-panic/lib/pizzas.ts) -> ensure timer badges are shown in courier and tony views! properly implement SSE according to our current implementation
