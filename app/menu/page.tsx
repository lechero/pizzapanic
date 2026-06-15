import { MenuOrderPanel } from "@/app/menu/_components/menu-order-panel"
import { pizzas } from "@/lib/pizzas"

export default function MenuPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 border-b border-border pb-5">
        <p className="font-mono text-xs uppercase text-muted-foreground">Pizza Panic</p>
        <h1 className="text-3xl font-semibold tracking-normal">Menu</h1>
      </header>

      <MenuOrderPanel pizzas={[...pizzas]} />
    </main>
  )
}

