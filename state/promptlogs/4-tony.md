respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repo and plan to implement the following:

a client side page at /tony showing the following layout

```html
  <tr>
    <td>received</td>
    <td>cooking</td>
    <td>cooked</td>
    <td>transit</td>
    <td>delivered</td>
  </tr>
  <tr>
    <td colspan="5">Panic State</td>
  </tr>
```

the orders should be placed in the right column according to it's state. 
each order has max 3 cta's shown on a line "prev", "panic", "next" -> this way they can be set to next or prev column (first and last column miss prev /next button)
this should update the order database record
we should have a constant in our project -> ovens: number = (4) -> these will be "magic" ovens -> they can handle 1 order each at the time -> so max 4 orders in "cooking" state -> 
panic arises when the first pizza in the order timesout -> we need some serverside ticker for this to send SSE events later!
we allso will have a constant for couriers[] -> this length is the max for "transit" state

-------

for now i need you to generate 12 couriers as constants like [pizzas.ts](/Users/miguelfuentes/projects/pizza-panic/lib/pizzas.ts) !  proceed with implementation!

-------

please only use icons for prev and next in the tony screen! redesign the whole card, in following layout-> 
<tr><td>prev icon</><td>content</td><td>next icon</td></tr>
<tr><td collspan=3>panic icon</td></tr>

-------

ensure, once an order is in panic mode, that it is only shown in the panic pane! also clearly show the state from which it panicked from

