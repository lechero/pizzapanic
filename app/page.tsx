import Link from "next/link"
import { Bike, ChefHat, ClipboardList, Menu as MenuIcon } from "lucide-react"

import { PanicAttackButton } from "@/app/_components/panic-attack-button"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <nav
        aria-label="Pizza Panic"
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <Button asChild size="lg" className="w-full justify-between">
          <Link href="/menu">
            Menu
            <MenuIcon />
          </Link>
        </Button>

        <div className="border-t border-border" />

        <Button
          asChild
          size="lg"
          variant="outline"
          className="w-full justify-between"
        >
          <Link href="/courier">
            Be Courier
            <Bike />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="w-full justify-between"
        >
          <Link href="/tony">
            Be Tony
            <ChefHat />
          </Link>
        </Button>

        <div className="border-t border-border" />

        <PanicAttackButton />

        <Button
          asChild
          size="lg"
          variant="ghost"
          className="w-full justify-between"
        >
          <Link href="/orders">
            Orders
            <ClipboardList />
          </Link>
        </Button>
      </nav>
    </main>
  )
}
