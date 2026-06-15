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
    name: "Sunny Ada",
  },
  {
    id: "courier-bruno",
    publicId: "COU-002",
    name: "Jolly Bruno",
  },
  {
    id: "courier-celeste",
    publicId: "COU-003",
    name: "Cheerful Celeste",
  },
  {
    id: "courier-dante",
    publicId: "COU-004",
    name: "Merry Dante",
  },
  {
    id: "courier-echo",
    publicId: "COU-005",
    name: "Bright Echo",
  },
  {
    id: "courier-frida",
    publicId: "COU-006",
    name: "Joyful Frida",
  },
  {
    id: "courier-gio",
    publicId: "COU-007",
    name: "Peppy Gio",
  },
  {
    id: "courier-hana",
    publicId: "COU-008",
    name: "Happy Hana",
  },
  {
    id: "courier-ivo",
    publicId: "COU-009",
    name: "Lucky Ivo",
  },
  {
    id: "courier-juno",
    publicId: "COU-010",
    name: "Breezy Juno",
  },
  {
    id: "courier-kira",
    publicId: "COU-011",
    name: "Kind Kira",
  },
  {
    id: "courier-luca",
    publicId: "COU-012",
    name: "Lively Luca",
  },
] as const satisfies readonly Courier[]

export type CourierId = (typeof couriers)[number]["id"]

export const maxCookingOrders = ovens
export const maxTransitOrders = couriers.length

export function getCourierById(id: string) {
  return couriers.find((courier) => courier.id === id) ?? null
}

export function getCourierByPublicId(publicId: string) {
  return couriers.find((courier) => courier.publicId === publicId) ?? null
}
