"use client"

import { usePathname } from 'next/navigation'

export function NavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-6">
      <a 
        href="/" 
        className={pathname === "/" ? "font-bold" : "text-foreground/60 hover:text-foreground"}
      >
        Home
      </a>
      <a 
        href="/funding-comparison" 
        className={pathname === "/funding-comparison" ? "font-bold" : "text-foreground/60 hover:text-foreground"}
      >
        Funding Comparison
      </a>
    </nav>
  );
}
