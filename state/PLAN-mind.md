# Plan in language

## Order

Generated CRUD according to "SKILL-AGENT-content-type.md" tied to /orders(/[id])
- order
    - id
    - trackingId
    - status: received | cooking | cooked | transit | delivered
    - panic: boolean (false)
    - order: [pizzaId, ...]
    - courierId: id || null

## Menu

a static page at /menu with 8 pizza's defined as constants in the code:
 pizza
    - id
    - publicId
    - name
    - price
    - panicTime

this page should have a client-side basket and CTA on each pizza to add to the basket
we need a bottom sticky 1 line bar showing the selection and a CTA to a dialog to order
this dialog should show "name" and "address" input -> when submitted it should store and order with "status=received" -> 
after this it should redirect to /tracking/[trackingId] 

## Tony

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
panic arises when the first pizza in the order timesout
we allso will have a constant for couriers[] -> this length is the max for "transit" state


## Courier

A client side page at /courier with 12 couriers defined as constants in the code (should be generated with happy names):
    couriers (12)
      - id
      - publicId 
      - name
Once a courier has been selected it should go to the courier page at /courier/[publicId] -> this should either:
    - show orders in "cooked" status -> so they can pick it up to transport -> once selected the order should go to "transit" -> 
      the courierId should be stored at order in this case
    - if an order exists with courier id and it's status is in transit -> show this order -> and a CTA to mark it as delivered

Extras:
    - SSE updates based on "order" status -> SKILL-AGENT-drizzle-SSE.md
    - Computed views: /kitchen + /kiosk
    - if max timeouts have been reached for and order/status according to defined constants:
        maxTimeouts: {
            received: number
            cooking: number ( + panicTimes bounces)
            cooked: number
            transit: number ( bit more since no distance data)
        }
        the dashboard should mark it as "panic" -> show UX badges/coloring 
    - a user should be able to drag and drop an order (let's use https://motion.dev/docs/react-reorder) to the next phase -> 
       and from cooking to panic as well! 
    - mobile views
    - PANIC mode
