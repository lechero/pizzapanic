export type Pizza = {
  id: string
  publicId: string
  name: string
  price: number
  panicTime: number
}

export const pizzas = [
  {
    id: "margherita-meteor",
    publicId: "PZA-001",
    name: "Margherita Meteor",
    price: 1095,
    panicTime: 12,
  },
  {
    id: "pepperoni-afterburner",
    publicId: "PZA-002",
    name: "Pepperoni Afterburner",
    price: 1395,
    panicTime: 14,
  },
  {
    id: "funghi-frequency",
    publicId: "PZA-003",
    name: "Funghi Frequency",
    price: 1295,
    panicTime: 13,
  },
  {
    id: "nduja-volcano",
    publicId: "PZA-004",
    name: "Nduja Volcano",
    price: 1495,
    panicTime: 10,
  },
  {
    id: "pesto-paradox",
    publicId: "PZA-005",
    name: "Pesto Paradox",
    price: 1350,
    panicTime: 15,
  },
  {
    id: "truffle-timewarp",
    publicId: "PZA-006",
    name: "Truffle Timewarp",
    price: 1695,
    panicTime: 18,
  },
  {
    id: "bbq-moonbase",
    publicId: "PZA-007",
    name: "BBQ Moonbase",
    price: 1450,
    panicTime: 16,
  },
  {
    id: "garden-glitch",
    publicId: "PZA-008",
    name: "Garden Glitch",
    price: 1250,
    panicTime: 11,
  },
] as const satisfies readonly Pizza[]

export type PizzaId = (typeof pizzas)[number]["id"]

export function formatPizzaPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100)
}

export function getPizzaById(id: string) {
  return pizzas.find((pizza) => pizza.id === id) ?? null
}
