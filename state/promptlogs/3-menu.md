respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repo and plan to implement the following:

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

we will need an addition, and migration, to orders for this! customer_name and customer_address !
