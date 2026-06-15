export const ovens: number = 4

export type Courier = {
  id: string
  publicId: string
  name: string
}

export const couriers = [
  {
    id: "courier-ada",
    publicId: "COU-001",
    name: "Ada",
  },
  {
    id: "courier-bruno",
    publicId: "COU-002",
    name: "Bruno",
  },
  {
    id: "courier-celeste",
    publicId: "COU-003",
    name: "Celeste",
  },
  {
    id: "courier-dante",
    publicId: "COU-004",
    name: "Dante",
  },
  {
    id: "courier-echo",
    publicId: "COU-005",
    name: "Echo",
  },
  {
    id: "courier-frida",
    publicId: "COU-006",
    name: "Frida",
  },
  {
    id: "courier-gio",
    publicId: "COU-007",
    name: "Gio",
  },
  {
    id: "courier-hana",
    publicId: "COU-008",
    name: "Hana",
  },
  {
    id: "courier-ivo",
    publicId: "COU-009",
    name: "Ivo",
  },
  {
    id: "courier-juno",
    publicId: "COU-010",
    name: "Juno",
  },
  {
    id: "courier-kira",
    publicId: "COU-011",
    name: "Kira",
  },
  {
    id: "courier-luca",
    publicId: "COU-012",
    name: "Luca",
  },
] as const satisfies readonly Courier[]

export type CourierId = (typeof couriers)[number]["id"]

export const maxCookingOrders = ovens
export const maxTransitOrders = couriers.length

export function getCourierById(id: string) {
  return couriers.find((courier) => courier.id === id) ?? null
}
